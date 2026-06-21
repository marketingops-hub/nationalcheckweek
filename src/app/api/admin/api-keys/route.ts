import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { adminClient } from '@/lib/adminClient';

export const GET = requireAdmin(async () => {
  const sb = adminClient();
  const { data, error } = await sb
    .from('api_keys')
    .select('id, label, provider, key_value, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ keys: data ?? [] });
});

export const POST = requireAdmin(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const { label, provider, key_value } = body as Record<string, string>;
  if (!label?.trim())     return NextResponse.json({ error: 'Label is required.' },     { status: 400 });
  if (!key_value?.trim()) return NextResponse.json({ error: 'Key value is required.' }, { status: 400 });
  if (!provider?.trim())  return NextResponse.json({ error: 'Provider is required.' },  { status: 400 });

  const sb = adminClient();
  const { data, error } = await sb
    .from('api_keys')
    .insert({ label: label.trim(), provider: provider.trim(), key_value: key_value.trim(), is_active: true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ key: data }, { status: 201 });
});
