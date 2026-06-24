import { NextRequest } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { ok, err, pgError, readParams } from '@/lib/content-creator/api-helpers';
import { verifyAdminAuth } from '@/lib/auth';
import { slugify, reserveSlug, deriveExcerpt } from '@/lib/content-creator/publish-utils';
import { stripHashHeadings } from '@/lib/content-creator/length';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export const POST = requireAdmin(async (req: NextRequest, ctx?: Ctx) => {
  const { id } = await readParams(ctx);
  const sb = adminClient();

  const auth = await verifyAdminAuth(req);
  const approvedBy = auth?.email ?? null;

  const { data: draft, error: loadErr } = await sb
    .from('content_drafts')
    .select('id, content_type, status, title, body, verification')
    .eq('id', id)
    .single();
  if (loadErr) return pgError(loadErr);

  if (!draft.verification?.submitted_for_review_at) {
    return err('Draft has not been submitted for review.', 409);
  }

  const updatedVerification = {
    ...(draft.verification ?? {}),
    approved_at: new Date().toISOString(),
    approved_by: approvedBy,
    rejection_reason: null,
  };

  const { data: updated, error: updateErr } = await sb
    .from('content_drafts')
    .update({
      verification: updatedVerification,
      status: 'verified',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (updateErr) return pgError(updateErr);

  // Auto-publish blog drafts with published: true on approval
  if (draft.content_type === 'blog') {
    const title = (draft.title ?? '').trim();
    const body = (draft.body ?? '').trim();

    if (title && body.length >= 50) {
      const { data: existing } = await sb
        .from('blog_posts')
        .select('id, slug')
        .eq('source_draft_id', id)
        .maybeSingle();

      const desiredSlug = slugify(title);
      const targetSlug = existing && existing.slug === desiredSlug
        ? existing.slug
        : await reserveSlug(sb, 'blog_posts', desiredSlug, existing?.id ?? null);

      const cleanBody = stripHashHeadings(body);
      const payload = {
        title,
        slug: targetSlug,
        content: cleanBody,
        excerpt: deriveExcerpt(cleanBody),
        author: null,
        feature_image: null,
        published: true,
        published_at: new Date().toISOString(),
        meta_title: title.slice(0, 60),
        meta_desc: deriveExcerpt(cleanBody).slice(0, 160),
        og_image: null,
        source_draft_id: id,
      };

      if (existing) {
        const { data: post, error: postErr } = await sb
          .from('blog_posts')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single();
        if (postErr) return pgError(postErr);
        return ok({ draft: updated, post, created: false });
      }

      const { data: post, error: postErr } = await sb
        .from('blog_posts')
        .insert(payload)
        .select()
        .single();
      if (postErr) return pgError(postErr);
      return ok({ draft: updated, post, created: true });
    }
  }

  return ok({ draft: updated });
});
