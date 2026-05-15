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
import { callEdge, contentCreatorAILimiter } from '../../route';
import { err, pgError, readParams } from '@/lib/content-creator/api-helpers';

export const runtime = 'nodejs';
export const maxDuration = 300;

type Ctx = { params: Promise<{ id: string }> };

export const POST = requireAdmin(async (req: NextRequest, ctx?: Ctx) => {
  const limited = contentCreatorAILimiter.check(req);
  if (limited) return limited;

  const { id } = await readParams(ctx);
  const sb = adminClient();

  const { data: current, error: loadErr } = await sb
    .from('content_drafts')
    .select('id, status')
    .eq('id', id)
    .single();
  if (loadErr) return pgError(loadErr);

  if (!canTransition(current.status, 'verifying')) {
    return err(`Cannot verify from status '${current.status}'.`, 409);
  }

  const edgeRes = await callEdge('content-creator-verify', { draft_id: id });
  return NextResponse.json(edgeRes.body, { status: edgeRes.status });
});
