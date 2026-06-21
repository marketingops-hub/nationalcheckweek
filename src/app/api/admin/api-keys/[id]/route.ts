import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { adminClient } from '@/lib/adminClient';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = requireAdmin(async (req: NextRequest, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (typeof body.label     === 'string') patch.label     = body.label.trim();
  if (typeof body.provider  === 'string') patch.provider  = body.provider.trim();
  if (typeof body.key_value === 'string') patch.key_value = body.key_value.trim();
  if (typeof body.is_active === 'boolean') patch.is_active = body.is_active;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const sb = adminClient();
  const { data, error } = await sb
    .from('api_keys')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ key: data });
});

export const DELETE = requireAdmin(async (_req: NextRequest, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();
  const { error } = await sb.from('api_keys').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
});
