import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { adminClient } from '@/lib/adminClient';
import { CtaPatchSchema, parseBody } from '@/lib/adminSchemas';

export const runtime = 'edge';

const CTA_ID = '00000000-0000-0000-0000-000000000002';

export const GET = requireAdmin(async () => {
  const sb = adminClient();
  const { data, error } = await sb.from('home_cta_settings').select('*').eq('id', CTA_ID).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});

export const PATCH = requireAdmin(async (req: NextRequest) => {
  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });

  const parsed = parseBody(CtaPatchSchema, raw);
  if (!parsed.ok) return parsed.response;

  const sb = adminClient();
  const { data, error } = await sb
    .from('home_cta_settings')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', CTA_ID)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});
