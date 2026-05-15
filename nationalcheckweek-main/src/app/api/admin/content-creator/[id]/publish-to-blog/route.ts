/* ═══════════════════════════════════════════════════════════════════════════
 * POST /api/admin/content-creator/[id]/publish-to-blog
 *
 * Sends a finalized blog draft over to the CMS-side `blog_posts` table as
 * an unpublished draft. The admin then toggles it live from /admin/blog.
 *
 * Why manual-to-draft rather than auto-publish? Admin preference (Apr 2026).
 * Keeping the blog_posts row un-published until a human clicks Publish on
 * /admin/blog means the content-creator pipeline can never put raw AI
 * output in front of readers.
 *
 * Idempotent: if this draft has already been published (source_draft_id
 * already linked), the existing blog_posts row is UPDATED with the latest
 * title / body / slug rather than a duplicate being inserted. The response
 * tells the caller which path we took via `created: boolean`.
 *
 * Preconditions:
 *   - content_type must be 'blog' (this endpoint is blog-only).
 *   - status must be 'verified' AND verification.approved_at must be set
 *     (i.e. human-signed-off, not merely AI-verified).
 *
 * Response on success:
 *   { post: BlogPost, created: boolean }
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { ok, err, pgError, readParams } from '@/lib/content-creator/api-helpers';
import { stripHashHeadings } from '@/lib/content-creator/length';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

/** Turn an arbitrary title into a kebab-case, URL-safe slug. Same rules
 *  as the blogPostCreateSchema regex: a-z0-9-. */
function slugify(title: string): string {
  return (title ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')         // strip combining accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
    || 'untitled';
}

/** Find an unused slug. If `base` is free, returns it unchanged; otherwise
 *  appends `-2`, `-3`, … until one is free or we give up at 50. Excludes
 *  the row we're about to update (so re-publishing the same draft doesn't
 *  fight itself for its own slug). */
async function reserveSlug(
  sb: ReturnType<typeof adminClient>,
  base: string,
  excludeId: string | null,
): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    let q = sb.from('blog_posts').select('id').eq('slug', candidate).limit(1);
    if (excludeId) q = q.neq('id', excludeId);
    const { data } = await q;
    if (!data || data.length === 0) return candidate;
  }
  // Pathological: 50 collisions. Fall back to a timestamp suffix which is
  // practically guaranteed unique. Better than throwing.
  return `${base}-${Date.now()}`;
}

/** Build the excerpt from the body — first 300 chars of the first
 *  non-empty paragraph, stripped of markdown emphasis chars. Respects
 *  the schema's 500-char cap comfortably. */
function deriveExcerpt(body: string): string {
  const firstPara = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .find((p) => p.length > 0 && !p.startsWith('---'));
  if (!firstPara) return '';
  return firstPara
    .replace(/\*\*([^*]+)\*\*/g, '$1')   // bold
    .replace(/[_*`~]/g, '')
    .slice(0, 300)
    .trim();
}

export const POST = requireAdmin(async (_req: NextRequest, ctx?: Ctx) => {
  const { id } = await readParams(ctx);
  const sb = adminClient();

  /* ─── Load + gate ──────────────────────────────────────────────────── */
  const { data: draft, error: loadErr } = await sb
    .from('content_drafts')
    .select('id, content_type, status, title, body, verification, ai_metadata, brief')
    .eq('id', id)
    .single();
  if (loadErr) return pgError(loadErr);

  if (draft.content_type !== 'blog') {
    return err(
      `Only blog drafts can be published to /admin/blog (this draft is '${draft.content_type}').`,
      400,
    );
  }
  if (draft.status !== 'verified' || !draft.verification?.approved_at) {
    return err(
      `Draft must be verified and finalized before publishing to the blog.`,
      409,
    );
  }
  const title = (draft.title ?? '').trim();
  if (!title) {
    return err(`Draft has no title — publish requires one.`, 400);
  }
  const body = (draft.body ?? '').trim();
  if (body.length < 50) {
    return err(`Draft body is too short to publish (< 50 characters).`, 400);
  }

  /* ─── Decide insert vs update ──────────────────────────────────────── */
  const { data: existing } = await sb
    .from('blog_posts')
    .select('id, slug')
    .eq('source_draft_id', id)
    .maybeSingle();

  const desiredSlug = slugify(title);
  // When updating, keep the existing slug IFF it still matches what the
  // current title would produce. Renaming the draft title between
  // publishes thus updates the slug (and, by design, may break any
  // external links admins copied from the old slug — that's the cost of
  // renaming). The prior check `existing.slug === slugify(existing.slug)`
  // was a tautology that locked the slug forever.
  const targetSlug = existing && existing.slug === desiredSlug
    ? existing.slug
    : await reserveSlug(sb, desiredSlug, existing?.id ?? null);

  // Apply the final body transformation — legacy '#' headings promoted to
  // bold so the CMS renders them cleanly (Apr-2026 admin rule).
  const cleanBody = stripHashHeadings(body);

  const payload = {
    title,
    slug:            targetSlug,
    content:         cleanBody,
    excerpt:         deriveExcerpt(cleanBody),
    author:          null,
    feature_image:   null,
    published:       false,                       // manual publish, per admin
    published_at:    null,
    meta_title:      title.slice(0, 60),
    meta_desc:       deriveExcerpt(cleanBody).slice(0, 160),
    og_image:        null,
    source_draft_id: id,
  };

  if (existing) {
    const { data, error } = await sb
      .from('blog_posts')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) return pgError(error);
    return ok({ post: data, created: false });
  }

  const { data, error } = await sb
    .from('blog_posts')
    .insert(payload)
    .select()
    .single();
  if (error) return pgError(error);
  return ok({ post: data, created: true });
});
