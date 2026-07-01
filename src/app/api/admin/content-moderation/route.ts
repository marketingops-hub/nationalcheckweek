import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireStaff } from '@/lib/auth';

export const runtime = 'nodejs';

// Staff (editor+) may review. Returns every draft that's been submitted for
// review — pending, approved, and rejected — so the UI can show an "Approved"
// column and recent history, not just the pending queue. The client derives
// review state from `verification` (see reviewState()).
export const GET = requireStaff(async (_req: NextRequest) => {
  const sb = adminClient();

  const { data, error } = await sb
    .from('content_drafts')
    .select('id, content_type, status, title, body, verification, created_by, updated_at, created_at')
    .not('verification->submitted_for_review_at', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ drafts: data ?? [] });
});
