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
