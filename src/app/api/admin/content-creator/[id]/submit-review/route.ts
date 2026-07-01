import { NextRequest } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireStaff } from '@/lib/auth';
import { ok, err, pgError, readParams } from '@/lib/content-creator/api-helpers';
import { verifyStaffAuth } from '@/lib/auth';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export const POST = requireStaff(async (req: NextRequest, ctx?: Ctx) => {
  const { id } = await readParams(ctx);
  const sb = adminClient();

  const auth = await verifyStaffAuth(req);
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

  // If a rejected draft is being resubmitted, move it out of the 'rejected'
  // pipeline column back to 'draft' so its status matches its review state
  // (pending again). Otherwise leave status untouched.
  const nextStatus = draft.status === 'rejected' ? 'draft' : draft.status;

  const { data: updated, error: updateErr } = await sb
    .from('content_drafts')
    .update({ status: nextStatus, verification: updatedVerification, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (updateErr) return pgError(updateErr);

  return ok({ draft: updated });
});
