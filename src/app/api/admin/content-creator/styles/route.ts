/* ═══════════════════════════════════════════════════════════════════════════
 * /api/admin/content-creator/styles
 *
 * GET  → list styles (all by default; `?active_only=true` for the brief UI)
 * POST → create a new writing style
 *
 * No AI calls here — this is plain CRUD. Not sharing the content-creator
 * rate limiter on purpose; the limiter is for expensive edge-fn calls.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin, verifyAdminAuth } from '@/lib/auth';
import { CreateStyleSchema } from '@/lib/content-creator/styles';

export const runtime = 'nodejs';

export const GET = requireAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get('active_only') === 'true';

  const sb = adminClient();
  let q = sb
    .from('content_writing_styles')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true });

  if (activeOnly) q = q.eq('is_active', true);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ styles: data ?? [] });
});

export const POST = requireAdmin(async (req: NextRequest) => {
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }

  const parsed = CreateStyleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // verifyAdminAuth was already called inside requireAdmin, but it doesn't
  // pass the user through — rerun to attribute created_by. Cheap (one
  // cached session lookup) so we don't bother refactoring the wrapper.
  const user = await verifyAdminAuth(req);

  const sb = adminClient();
  const { data, error } = await sb
    .from('content_writing_styles')
    .insert({
      title:       parsed.data.title,
      description: parsed.data.description ?? null,
      prompt:      parsed.data.prompt,
      is_active:   parsed.data.is_active ?? true,
      sort_order:  parsed.data.sort_order ?? 0,
      created_by:  user?.id ?? null,
    })
    .select()
    .single();

  if (error) {
    // Unique-violation on title is the most likely failure; surface as 409.
    const status = error.code === '23505' ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ style: data }, { status: 201 });
});
