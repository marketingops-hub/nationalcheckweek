import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { adminClient } from '@/lib/adminClient';
import { RegisterPagePatchSchema, parseBody } from '@/lib/adminSchemas';

export const runtime = 'edge';

export const GET = requireAdmin(async () => {
  const sb = adminClient();
  const { data, error } = await sb.from('register_page').select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
});

export const PATCH = requireAdmin(async (req: NextRequest) => {
  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = parseBody(RegisterPagePatchSchema, raw);
  if (!parsed.ok) return parsed.response;

  const sb = adminClient();
  const { data: existingPage } = await sb.from('register_page').select('id').single();
  if (!existingPage) return NextResponse.json({ error: 'Register page not found' }, { status: 404 });

  const { data, error } = await sb
    .from('register_page')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', existingPage.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
});
