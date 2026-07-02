import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireStaff, verifyStaffAuth } from '@/lib/auth';
import { revalidateEntity } from '@/lib/revalidate';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

/** Reject a blog post under review. Records the reason and unpublishes it
 *  (a rejected post must not stay live). Author revises and resubmits. */
export const POST = requireStaff(async (req: NextRequest, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();
  const auth = await verifyStaffAuth(req);

  let reason: string | undefined;
  try {
    const body = await req.json();
    reason = typeof body?.reason === 'string' ? body.reason.trim() : undefined;
  } catch { /* no body is fine */ }

  const { data, error } = await sb
    .from('blog_posts')
    .update({
      review_status:    'rejected',
      rejection_reason: reason ?? null,
      reviewed_by:      auth?.email ?? null,
      reviewed_at:      new Date().toISOString(),
      published:        false,
      updated_at:       new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateEntity('blog', data.slug);
  return NextResponse.json({ post: data });
});
