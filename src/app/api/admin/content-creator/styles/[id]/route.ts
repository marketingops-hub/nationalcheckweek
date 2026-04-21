/* ═══════════════════════════════════════════════════════════════════════════
 * /api/admin/content-creator/styles/[id]
 *
 * GET    → fetch one style
 * PATCH  → edit title / description / prompt / is_active / sort_order
 * DELETE → hard delete
 *
 * Hard delete is intentional (no archive). Styles are cheap and fully
 * user-managed. Any content_drafts already generated with a now-deleted
 * style keep working — the edge fns treat a missing style_id as "no style
 * prompt".
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { PatchStyleSchema } from '@/lib/content-creator/styles';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export const GET = requireAdmin(async (_req: NextRequest, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();
  const { data, error } = await sb
    .from('content_writing_styles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    const status = error.code === 'PGRST116' ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ style: data });
});

export const PATCH = requireAdmin(async (req: NextRequest, ctx?: Ctx) => {
  const { id } = await ctx!.params;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }

  const parsed = PatchStyleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
  }

  const sb = adminClient();
  const { data, error } = await sb
    .from('content_writing_styles')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    // Unique-violation on title → 409 so the UI can offer a clean message.
    if (error.code === '23505') return NextResponse.json({ error: error.message }, { status: 409 });
    const status = error.code === 'PGRST116' ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ style: data });
});

export const DELETE = requireAdmin(async (_req: NextRequest, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();
  const { error } = await sb
    .from('content_writing_styles')
    .delete()
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
});
