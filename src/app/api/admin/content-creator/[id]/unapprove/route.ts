/* ═══════════════════════════════════════════════════════════════════════════
 * POST /api/admin/content-creator/[id]/unapprove
 *
 * Inverse of /approve: moves a row from `approved_idea` back to `idea` so
 * the admin can edit or discard it before committing any AI spend on the
 * generate stage. No-op / 409 for rows that are already in 'idea' or past
 * the approval point.
 *
 * Separate from the generic PATCH endpoint on purpose — PATCH handles
 * user-content fields (title/body), this one handles the workflow
 * transition and is guarded by `canTransition`.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { canTransition } from '@/lib/content-creator/schemas';
import { ok, err, pgError, readParams } from '@/lib/content-creator/api-helpers';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export const POST = requireAdmin(async (_req: NextRequest, ctx?: Ctx) => {
  const { id } = await readParams(ctx);
  const sb = adminClient();

  const { data: current, error: loadErr } = await sb
    .from('content_drafts')
    .select('id, status')
    .eq('id', id)
    .single();
  if (loadErr) return pgError(loadErr);

  if (!canTransition(current.status, 'idea')) {
    return err(`Cannot unapprove from status '${current.status}'.`, 409);
  }

  const { data, error } = await sb
    .from('content_drafts')
    .update({ status: 'idea' })
    .eq('id', id)
    .select()
    .single();
  if (error) return pgError(error);
  return ok({ draft: data });
});
