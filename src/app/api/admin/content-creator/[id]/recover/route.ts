/* ═══════════════════════════════════════════════════════════════════════════
 * POST /api/admin/content-creator/[id]/recover
 *
 * Escape hatch for drafts stuck in `generating` / `verifying`.
 *
 * Why this exists: the edge functions flip status on entry and flip it
 * back on exit. If the edge fn crashes *outside* its try/catch (Deno
 * OOM, Supabase gateway 150s timeout, network drop) the row never
 * transitions out of the in-flight state. The client then polls for
 * 90s, flips `stuck=true`, and — before this endpoint — the admin had
 * to SSH into psql to unstick the row.
 *
 * Safety gates so this can't be abused to bypass the state machine:
 *
 *   1. Row must currently be in `generating` OR `verifying`.
 *   2. Row must have been in that state for ≥ STUCK_MIN_SECONDS
 *      (5 min) — below that, a real in-flight request is likely
 *      still running and we don't want to race it.
 *
 * On success we flip the row back to the editable state that came
 * before the failed stage and stash a synthetic `last_error` on
 * `ai_metadata` so the admin understands *why* their draft moved:
 *
 *   generating → approved_idea   (first generation)
 *   generating → draft           (regeneration from draft / verified / rejected)
 *   verifying  → draft
 *
 * We can't always tell which source status a `generating` row came from
 * (the edge fn only stores prior status when it fails inside its try).
 * Heuristic: if body is non-empty we assume regen (prior=draft), else
 * first-gen (prior=approved_idea). Matches admin expectations because
 * a first-pass generate on an empty body would never have produced text.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { ok, err, pgError, readParams } from '@/lib/content-creator/api-helpers';

export const runtime = 'nodejs';

/** Minimum time a row must have been stuck before we'll recover it.
 *  Matches the client-side poll cap (30 × 3s = 90s) with headroom to
 *  cover the edge fn's own max runtime (~150s) plus a safety margin. */
const STUCK_MIN_SECONDS = 300; // 5 minutes

type Ctx = { params: Promise<{ id: string }> };

export const POST = requireAdmin(async (_req: NextRequest, ctx?: Ctx) => {
  const { id } = await readParams(ctx);
  const sb = adminClient();

  const { data: current, error: loadErr } = await sb
    .from('content_drafts')
    .select('id, status, body, updated_at, ai_metadata')
    .eq('id', id)
    .single();
  if (loadErr) return pgError(loadErr);

  if (current.status !== 'generating' && current.status !== 'verifying') {
    return err(
      `Recover only applies to stuck rows (current status '${current.status}').`,
      409,
    );
  }

  const updatedAt = new Date(current.updated_at).getTime();
  const ageSec = (Date.now() - updatedAt) / 1000;
  if (ageSec < STUCK_MIN_SECONDS) {
    return err(
      `Row has only been in '${current.status}' for ${Math.round(ageSec)}s. Wait at least ${STUCK_MIN_SECONDS}s before recovering so we don't race a real in-flight request.`,
      409,
    );
  }

  const nextStatus = current.status === 'verifying'
    ? 'draft'
    : (typeof current.body === 'string' && current.body.trim().length > 0
        ? 'draft'
        : 'approved_idea');

  const ai_metadata = {
    ...(current.ai_metadata ?? {}),
    last_error:         `Recovered from stuck '${current.status}' state after ${Math.round(ageSec)}s.`,
    last_error_at:      new Date().toISOString(),
    last_error_stage:   current.status,
    recovered_from:     current.status,
    recovered_to:       nextStatus,
    recovered_at:       new Date().toISOString(),
  };

  const { data, error } = await sb
    .from('content_drafts')
    .update({ status: nextStatus, ai_metadata })
    .eq('id', id)
    // Concurrency guard: only flip if the row is still in the stuck
    // state we observed above. If an edge fn completed between our
    // SELECT and our UPDATE we don't want to clobber its result.
    .eq('status', current.status)
    .select()
    .maybeSingle();
  if (error) return pgError(error);
  if (!data) {
    return err(
      `Row transitioned out of '${current.status}' while recovery was running — refresh the page.`,
      409,
    );
  }

  return ok({ draft: data, recovered_from: current.status, recovered_to: nextStatus });
});
