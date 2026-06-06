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
import { slugify, reserveSlug, deriveExcerpt } from '@/lib/content-creator/publish-utils';
import { stripHashHeadings } from '@/lib/content-creator/length';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

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
    : await reserveSlug(sb, 'blog_posts', desiredSlug, existing?.id ?? null);

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
