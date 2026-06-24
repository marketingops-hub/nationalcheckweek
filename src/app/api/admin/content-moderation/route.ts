import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

export const GET = requireAdmin(async (_req: NextRequest) => {
  const sb = adminClient();

  const { data, error } = await sb
    .from('content_drafts')
    .select('id, content_type, status, title, body, verification, created_by, updated_at, created_at')
    .not('verification->submitted_for_review_at', 'is', null)
    .is('verification->approved_at', null)
    .order('verification->submitted_for_review_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ drafts: data ?? [] });
});
