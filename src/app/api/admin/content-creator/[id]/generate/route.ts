/* ═══════════════════════════════════════════════════════════════════════════
 * POST /api/admin/content-creator/[id]/generate
 *
 * Kicks off stage 2: approved_idea → draft. Proxies to the edge fn with
 * stage='generate'. Long-running (up to ~60s), so UI should show a spinner
 * and poll/refresh once the response lands.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { canTransition } from '@/lib/content-creator/schemas';
import { callEdge } from '../../route';

export const runtime = 'nodejs';
// Generation can take >30s on the edge fn round-trip. Opt into the longer
// Vercel serverless timeout for this specific route.
export const maxDuration = 90;

type Ctx = { params: Promise<{ id: string }> };

export const POST = requireAdmin(async (_req: NextRequest, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();

  // Pre-flight status check — prevents wasting an AI call on an invalid state.
  const { data: current, error: loadErr } = await sb
    .from('content_drafts')
    .select('id, status')
    .eq('id', id)
    .single();
  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 404 });

  if (!canTransition(current.status, 'generating')) {
    return NextResponse.json(
      { error: `Cannot generate from status '${current.status}'. Approve the idea first.` },
      { status: 409 },
    );
  }

  const edgeRes = await callEdge({ stage: 'generate', draft_id: id });
  return NextResponse.json(edgeRes.body, { status: edgeRes.status });
});
