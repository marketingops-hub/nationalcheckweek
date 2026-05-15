/* ═══════════════════════════════════════════════════════════════════════════
 * POST /api/admin/content-creator/[id]/approve
 *
 * Transitions a draft from 'idea' → 'approved_idea'. Cheap, no AI calls.
 * Separate route so the UI can approve ideas in bulk without touching the
 * generate endpoint (which is rate-limited).
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

  if (!canTransition(current.status, 'approved_idea')) {
    return err(`Cannot approve from status '${current.status}'.`, 409);
  }

  const { data, error } = await sb
    .from('content_drafts')
    .update({ status: 'approved_idea' })
    .eq('id', id)
    .select()
    .single();
  if (error) return pgError(error);
  return ok({ draft: data });
});
