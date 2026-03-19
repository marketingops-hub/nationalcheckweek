import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

interface RouteParams { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') ?? 'applications';
  const table = type === 'nominations' ? 'ambassador_nominations' : 'ambassador_applications';

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  delete body.id; delete body.created_at;

  const sb = adminClient();
  const { data, error } = await sb
    .from(table)
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') ?? 'applications';
  const table = type === 'nominations' ? 'ambassador_nominations' : 'ambassador_applications';

  const sb = adminClient();
  const { error } = await sb.from(table).delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
