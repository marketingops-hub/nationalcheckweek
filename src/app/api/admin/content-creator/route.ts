/* ═══════════════════════════════════════════════════════════════════════════
 * /api/admin/content-creator
 *
 * GET  → list drafts, filterable by status and content_type.
 * POST → kick off stage 1 (generate_ideas). Creates N rows with status='idea'.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { GenerateIdeasSchema } from '@/lib/content-creator/schemas';

export const runtime = 'nodejs';

/* ─── GET — list ─────────────────────────────────────────────────────────── */

export const GET = requireAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const status       = searchParams.get('status');
  const content_type = searchParams.get('content_type');
  const limit        = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);

  const sb = adminClient();
  let q = sb
    .from('content_drafts')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (status)       q = q.eq('status', status);
  if (content_type) q = q.eq('content_type', content_type);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ drafts: data ?? [] });
});

/* ─── POST — generate ideas via edge function ─────────────────────────────── */

export const POST = requireAdmin(async (req: NextRequest) => {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = GenerateIdeasSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const edgeRes = await callEdge({ stage: 'generate_ideas', ...parsed.data });
  return NextResponse.json(edgeRes.body, { status: edgeRes.status });
});

/* ─── Shared edge-function proxy used by POST and the action routes ──────── */

export async function callEdge(payload: Record<string, unknown>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return { status: 500, body: { error: 'Supabase env vars missing.' } };
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/content-creator`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      Authorization:   `Bearer ${serviceKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({ error: 'Edge fn returned non-JSON.' }));
  return { status: res.ok ? 200 : res.status, body: data };
}
