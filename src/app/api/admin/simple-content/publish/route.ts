/* ═══════════════════════════════════════════════════════════════════════════
 * POST /api/admin/simple-content/publish
 *
 * Takes a finished piece from the Simplified Content creator and inserts it
 * into `blog_posts` as an UNPUBLISHED draft. The admin flips it live from
 * /admin/blog exactly as they would for any other piece.
 *
 * Body: { title: string, body: string, history_id?: string }
 * Response: { post: BlogPost, created: boolean }
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { ok, err, pgError } from '@/lib/content-creator/api-helpers';
import { slugify, reserveSlug, deriveExcerpt } from '@/lib/content-creator/publish-utils';
import { stripHashHeadings } from '@/lib/content-creator/length';

export const runtime = 'nodejs';

export const POST = requireAdmin(async (req: NextRequest) => {
  let body: unknown;
  try { body = await req.json(); } catch {
    return err('Invalid JSON body.', 400);
  }

  const { title: rawTitle, body: rawBody, history_id: rawHistoryId } =
    (body as { title?: unknown; body?: unknown; history_id?: unknown }) ?? {};

  const title     = typeof rawTitle     === 'string' ? rawTitle.trim()     : '';
  const content   = typeof rawBody      === 'string' ? rawBody.trim()      : '';
  const historyId = typeof rawHistoryId === 'string' ? rawHistoryId.trim() : null;

  if (!title)            return err('title is required.', 400);
  if (content.length < 50) return err('body is too short (< 50 chars).', 400);

  const sb = adminClient();
  const desiredSlug = slugify(title);
  const targetSlug  = await reserveSlug(sb, 'blog_posts', desiredSlug, null);
  const cleanBody   = stripHashHeadings(content);
  // Fall back to title when the body has no usable prose paragraph (e.g.
  // malformed model output) so meta_desc is never blank.
  const excerpt     = deriveExcerpt(cleanBody) || title.slice(0, 300);

  const { data, error } = await sb
    .from('blog_posts')
    .insert({
      title,
      slug:            targetSlug,
      content:         cleanBody,
      excerpt,
      author:          null,
      feature_image:   null,
      published:       false,
      published_at:    null,
      meta_title:      title.slice(0, 60),
      meta_desc:       excerpt.slice(0, 160),
      og_image:        null,
      source_draft_id: null,
    })
    .select()
    .single();

  if (error) return pgError(error);

  // Link the history entry to the published post (best-effort, non-blocking)
  if (historyId && data) {
    await sb
      .from('simple_content_history')
      .update({ published_post_id: (data as { id?: string }).id })
      .eq('id', historyId)
      .then(() => undefined, () => undefined);
  }

  return ok({ post: data, created: true });
});
