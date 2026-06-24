import { NextRequest } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { ok, err, pgError, readParams } from '@/lib/content-creator/api-helpers';
import { verifyAdminAuth } from '@/lib/auth';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export const POST = requireAdmin(async (req: NextRequest, ctx?: Ctx) => {
  const { id } = await readParams(ctx);
  const sb = adminClient();

  const auth = await verifyAdminAuth(req);
  const submittedBy = auth?.email ?? null;

  const { data: draft, error: loadErr } = await sb
    .from('content_drafts')
    .select('id, status, verification')
    .eq('id', id)
    .single();
  if (loadErr) return pgError(loadErr);

  if (!['draft', 'verified', 'rejected'].includes(draft.status)) {
    return err(`Cannot submit a draft with status '${draft.status}' for review.`, 409);
  }

  const updatedVerification = {
    ...(draft.verification ?? {}),
    submitted_for_review_at: new Date().toISOString(),
    submitted_for_review_by: submittedBy,
    rejection_reason: null,
  };

  const { data: updated, error: updateErr } = await sb
    .from('content_drafts')
    .update({ verification: updatedVerification, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (updateErr) return pgError(updateErr);

  return ok({ draft: updated });
});
