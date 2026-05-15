/* ═══════════════════════════════════════════════════════════════════════════
 * POST /api/admin/content-creator/[id]/regenerate
 *
 * "Request improvement" flow. Body: { feedback: string }.
 *
 * Steps:
 *   1. Validate status — must be draft | verified | rejected. The state
 *      machine allows those → 'generating'.
 *   2. Merge the feedback into brief.regeneration_feedback. The generate
 *      edge fn reads this and injects it into the user prompt.
 *   3. Call the content-creator-generate edge fn as usual.
 *
 * On success the edge fn overwrites body/title and clears the feedback
 * field (so a follow-up generation doesn't silently reuse stale feedback).
 *
 * Rate-limited the same way as /generate — regen is an AI call too.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { canTransition } from '@/lib/content-creator/schemas';
import { callEdge, contentCreatorAILimiter } from '../../route';
import {
  ok, err, pgError, parseJsonBody, validate, readParams,
} from '@/lib/content-creator/api-helpers';

export const runtime = 'nodejs';
export const maxDuration = 300;

type Ctx = { params: Promise<{ id: string }> };

const RegenerateSchema = z.object({
  feedback: z.string().min(3, 'Feedback must be at least 3 characters').max(2000),
});

export const POST = requireAdmin(async (req: NextRequest, ctx?: Ctx) => {
  const limited = contentCreatorAILimiter.check(req);
  if (limited) return limited;

  const { id } = await readParams(ctx);

  const body = await parseJsonBody(req);
  if (body instanceof NextResponse) return body;

  const input = validate(RegenerateSchema, body);
  if (input instanceof NextResponse) return input;

  const sb = adminClient();

  // Pre-flight: fetch brief + status so we can merge feedback in and
  // reject bad transitions before we touch the AI limiter budget.
  const { data: current, error: loadErr } = await sb
    .from('content_drafts')
    .select('id, status, brief')
    .eq('id', id)
    .single();
  if (loadErr) return pgError(loadErr);

  if (!canTransition(current.status, 'generating')) {
    return err(
      `Cannot regenerate from status '${current.status}'. Valid from: draft, verified, rejected.`,
      409,
    );
  }

  const nextBrief = {
    ...(current.brief ?? {}),
    regeneration_feedback: input.feedback.trim(),
  };

  const { error: patchErr } = await sb
    .from('content_drafts')
    .update({ brief: nextBrief })
    .eq('id', id);
  if (patchErr) return pgError(patchErr);

  // Edge fn handles the status flip to 'generating' itself. If it fails
  // the row stays whatever it was and the feedback is kept so the admin
  // can retry. On success the edge fn also clears regeneration_feedback.
  const edgeRes = await callEdge('content-creator-generate', {
    draft_id: id,
    regeneration: true,
  });
  if (edgeRes.status >= 400) {
    return NextResponse.json(edgeRes.body, { status: edgeRes.status });
  }

  return ok(edgeRes.body as Record<string, unknown>);
});
