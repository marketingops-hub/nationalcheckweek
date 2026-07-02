import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireStaff, verifyStaffAuth } from '@/lib/auth';
import { revalidateEntity } from '@/lib/revalidate';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

/** Approve a blog post that's pending review → publishes it live. */
export const POST = requireStaff(async (req: NextRequest, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();
  const auth = await verifyStaffAuth(req);

  const { data: cur, error: loadErr } = await sb
    .from('blog_posts').select('review_status, slug, published_at').eq('id', id)
    .single<{ review_status: string; slug: string; published_at: string | null }>();
  if (loadErr || !cur) return NextResponse.json({ error: loadErr?.message ?? 'Not found' }, { status: 404 });
  if (cur.review_status !== 'pending') {
    return NextResponse.json({ error: `Can only approve a post that's pending review (is '${cur.review_status}').` }, { status: 409 });
  }

  const { data, error } = await sb
    .from('blog_posts')
    .update({
      review_status: 'approved',
      reviewed_by:   auth?.email ?? null,
      reviewed_at:   new Date().toISOString(),
      published:     true,
      published_at:  cur.published_at ?? new Date().toISOString(),
      updated_at:    new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateEntity('blog', data.slug);
  return NextResponse.json({ post: data });
});
