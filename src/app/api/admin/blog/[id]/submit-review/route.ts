import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireStaff, verifyStaffAuth } from '@/lib/auth';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

/** Submit a blog post for review. Moves it to 'pending' and clears any prior
 *  rejection. Publishing stays blocked until an approver approves it. */
export const POST = requireStaff(async (req: NextRequest, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();
  const auth = await verifyStaffAuth(req);

  // Only a draft or a previously-rejected post can be submitted. Guards
  // against double-submits ('pending') and re-submitting an already-approved/
  // live post (which would leave it published yet marked 'pending').
  const { data: cur, error: loadErr } = await sb
    .from('blog_posts').select('review_status').eq('id', id)
    .single<{ review_status: string }>();
  if (loadErr || !cur) return NextResponse.json({ error: loadErr?.message ?? 'Not found' }, { status: 404 });
  if (cur.review_status !== 'draft' && cur.review_status !== 'rejected') {
    return NextResponse.json(
      { error: `Can't submit a post that's '${cur.review_status}' for review.` },
      { status: 409 },
    );
  }

  const { data, error } = await sb
    .from('blog_posts')
    .update({
      review_status:    'pending',
      submitted_by:     auth?.email ?? null,
      submitted_at:     new Date().toISOString(),
      rejection_reason: null,
      updated_at:       new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
});
