/* ═══════════════════════════════════════════════════════════════════════════
 * POST /api/admin/content-creator/topics/generate
 *
 * Calls the content-creator edge function with stage='generate_topics'.
 * Shares the contentCreatorAILimiter budget with ideas/generate/verify
 * because it's an AI call with real $$ cost.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { GenerateTopicsSchema } from '@/lib/content-creator/topics';
import { callEdge, contentCreatorAILimiter } from '../../route';

export const runtime = 'nodejs';
export const maxDuration = 300;

export const POST = requireAdmin(async (req: NextRequest) => {
  const limited = contentCreatorAILimiter.check(req);
  if (limited) return limited;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }

  const parsed = GenerateTopicsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const edgeRes = await callEdge('content-creator-topics', { ...parsed.data });
  return NextResponse.json(edgeRes.body, { status: edgeRes.status });
});
