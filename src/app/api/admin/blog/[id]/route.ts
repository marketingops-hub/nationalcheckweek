import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireStaff } from '@/lib/auth';
import { BlogPatchSchema, parseBody } from '@/lib/adminSchemas';
import { revalidateEntity } from '@/lib/revalidate';

type RouteCtx = { params: Promise<{ id: string }> };

export const GET = requireStaff(async (_req: NextRequest, ctx?: RouteCtx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();
  const { data, error } = await sb.from('blog_posts').select('*').eq('id', id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
  return NextResponse.json({ post: data });
});

export const PATCH = requireStaff(async (req: NextRequest, ctx?: RouteCtx) => {
  const { id } = await ctx!.params;
  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = parseBody(BlogPatchSchema, raw);
  if (!parsed.ok) return parsed.response;

  const patch = { ...parsed.data, updated_at: new Date().toISOString() } as Record<string, unknown>;

  const sb = adminClient();

  // Fields whose change to an already-approved post should force re-review.
  const CONTENT_FIELDS = ['title', 'slug', 'excerpt', 'content', 'author', 'feature_image', 'meta_title', 'meta_desc', 'og_image'] as const;

  // Load the current row so we can (a) enforce the publish gate and (b) detect
  // content edits to an approved post.
  const { data: cur } = await sb
    .from('blog_posts')
    .select('review_status, published, title, slug, excerpt, content, author, feature_image, meta_title, meta_desc, og_image')
    .eq('id', id)
    .single<Record<string, unknown>>();

  // Approval gate: a post may only be set published=true once approved.
  if (parsed.data.published === true && cur?.review_status !== 'approved') {
    return NextResponse.json(
      { error: 'This post must be approved before publishing — submit it for review first.' },
      { status: 409 },
    );
  }

  // Re-review gate: editing the content of an approved post takes it back to
  // pending review and off-live, so the changed version can't reach the public
  // without re-approval. Only triggers on an actual content change (so a
  // no-op save of a live post doesn't unpublish it).
  const contentChanged = CONTENT_FIELDS.some(
    (f) => f in parsed.data && (parsed.data as Record<string, unknown>)[f] !== cur?.[f],
  );
  const reGated = cur?.review_status === 'approved' && contentChanged && parsed.data.published !== true;
  if (reGated) {
    patch.review_status    = 'pending';
    patch.published        = false;
    patch.submitted_at     = new Date().toISOString();
    patch.rejection_reason = null;
  }

  if (patch.published && !patch.published_at) {
    patch.published_at = new Date().toISOString();
  }

  const { data, error } = await sb.from('blog_posts').update(patch).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateEntity('blog', data.slug);
  return NextResponse.json({ post: data });
});

export const DELETE = requireStaff(async (_req: NextRequest, ctx?: RouteCtx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();
  const { error } = await sb.from('blog_posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateEntity('blog');
  return NextResponse.json({ success: true });
});
