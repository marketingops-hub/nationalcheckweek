import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/adminAuth';
import { SubmissionPatchSchema, parseBody } from '@/lib/adminSchemas';

type RouteCtx = { params: Promise<{ id: string }> };

export const PATCH = async (req: NextRequest, ctx?: RouteCtx) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx!.params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') ?? 'applications';
  
  // Validate type parameter to prevent table injection
  if (type !== 'nominations' && type !== 'applications') {
    return NextResponse.json({ error: 'Invalid type parameter. Must be "nominations" or "applications"' }, { status: 400 });
  }
  
  const table = type === 'nominations' ? 'ambassador_nominations' : 'ambassador_applications';

  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = parseBody(SubmissionPatchSchema, raw);
  if (!parsed.ok) return parsed.response;

  const patch = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined));
  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });

  const sb = adminClient();
  const { data, error } = await sb.from(table).update(patch).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
};

export const DELETE = async (_req: NextRequest, ctx?: RouteCtx) => {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx!.params;
  const { searchParams } = new URL(_req.url);
  const type = searchParams.get('type') ?? 'applications';
  
  // Validate type parameter to prevent table injection
  if (type !== 'nominations' && type !== 'applications') {
    return NextResponse.json({ error: 'Invalid type parameter. Must be "nominations" or "applications"' }, { status: 400 });
  }
  
  const table = type === 'nominations' ? 'ambassador_nominations' : 'ambassador_applications';

  const sb = adminClient();
  const { error } = await sb.from(table).delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
};
