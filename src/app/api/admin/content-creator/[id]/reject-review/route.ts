import { NextRequest } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireStaff } from '@/lib/auth';
import { ok, err, pgError, readParams } from '@/lib/content-creator/api-helpers';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export const POST = requireStaff(async (req: NextRequest, ctx?: Ctx) => {
  const { id } = await readParams(ctx);
  const sb = adminClient();

  let reason: string | undefined;
  try {
    const body = await req.json();
    reason = typeof body?.reason === 'string' ? body.reason.trim() : undefined;
  } catch { /* no body is fine */ }

  const { data: draft, error: loadErr } = await sb
    .from('content_drafts')
    .select('id, status, verification')
    .eq('id', id)
    .single();
  if (loadErr) return pgError(loadErr);

  if (!draft.verification?.submitted_for_review_at) {
    return err('Draft has not been submitted for review.', 409);
  }

  // Keep submitted_for_review_at/_by intact — reviewState() checks that field
  // first, so clearing it would make a rejected draft read as 'none' (losing
  // its Rejected chip, the rejection-reason banner, and its place in the
  // moderation history). Rejection is expressed by rejection_reason + status.
  const updatedVerification = {
    ...(draft.verification ?? {}),
    rejection_reason: reason ?? null,
  };

  const { data: updated, error: updateErr } = await sb
    .from('content_drafts')
    .update({
      verification: updatedVerification,
      status: 'rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (updateErr) return pgError(updateErr);

  return ok({ draft: updated });
});
