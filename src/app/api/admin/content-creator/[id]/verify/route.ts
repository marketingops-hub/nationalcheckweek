/* ═══════════════════════════════════════════════════════════════════════════
 * POST /api/admin/content-creator/[id]/verify
 *
 * Stage 3: draft | rejected → verified | rejected. Proxies to the edge fn
 * with stage='verify'. Anthropic cross-checks every factual claim in the
 * body against the vault and returns a structured verdict.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { canTransition } from '@/lib/content-creator/schemas';
import { callEdge } from '../../route';

export const runtime = 'nodejs';
export const maxDuration = 90;

type Ctx = { params: Promise<{ id: string }> };

export const POST = requireAdmin(async (_req: NextRequest, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();

  const { data: current, error: loadErr } = await sb
    .from('content_drafts')
    .select('id, status')
    .eq('id', id)
    .single();
  if (loadErr) return NextResponse.json({ error: loadErr.message }, { status: 404 });

  if (!canTransition(current.status, 'verifying')) {
    return NextResponse.json(
      { error: `Cannot verify from status '${current.status}'.` },
      { status: 409 },
    );
  }

  const edgeRes = await callEdge({ stage: 'verify', draft_id: id });
  return NextResponse.json(edgeRes.body, { status: edgeRes.status });
});
