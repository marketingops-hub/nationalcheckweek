/* ═══════════════════════════════════════════════════════════════════════════
 * POST /api/admin/content-creator/[id]/finalize
 *
 * "Human sign-off". Runs after the verifier has passed (status === 'verified')
 * and marks the verification object with `approved_at` + `approved_by`.
 * The row stays in the `verified` status — we don't introduce a new enum
 * value, we just flip a flag so:
 *
 *   - Existing queries for status='verified' keep working.
 *   - The UI can detect sign-off via `verification.approved_at != null` and
 *     show a final badge / lock edits.
 *
 * This is the 2-step flow the user asked for:
 *   1. Verify (AI claim-check)
 *   2. Finalize (human sign-off, this endpoint)
 *
 * Why not a status change? `approved` would need a DB migration, state-
 * machine update, and every listing/filter to grow a new case. A flag
 * achieves the same outcome with far less blast radius.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin, verifyAdminAuth } from '@/lib/auth';
import { ok, err, pgError, readParams } from '@/lib/content-creator/api-helpers';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export const POST = requireAdmin(async (req: NextRequest, ctx?: Ctx) => {
  const { id } = await readParams(ctx);
  const sb = adminClient();

  const { data: current, error: loadErr } = await sb
    .from('content_drafts')
    .select('id, status, verification')
    .eq('id', id)
    .single();
  if (loadErr) return pgError(loadErr);

  // Finalize only makes sense once the verifier has run. Don't let admins
  // skip verification — that's what this flow is designed to prevent.
  if (current.status !== 'verified') {
    return err(
      `Finalize requires status='verified' (got '${current.status}'). Run Verify first.`,
      409,
    );
  }

  if (current.verification?.approved_at) {
    return err('Draft is already finalized.', 409);
  }

  const user = await verifyAdminAuth(req);

  const nextVerification = {
    ...(current.verification ?? {}),
    approved_at: new Date().toISOString(),
    approved_by: user?.id ?? null,
  };

  const { data, error } = await sb
    .from('content_drafts')
    .update({ verification: nextVerification })
    .eq('id', id)
    .select()
    .single();

  if (error) return pgError(error);
  return ok({ draft: data });
});
