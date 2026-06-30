/* ═══════════════════════════════════════════════════════════════════════════
 * POST /api/admin/vault/documents/[id]/reindex
 *
 * Manually re-run the indexer pipeline on an existing document. Useful when:
 *   • Original extraction failed and the admin wants to retry.
 *   • Chunking / embedding strategy changed and we want to refresh the index.
 *   • The underlying source was updated (new PDF version, URL recrawl).
 *
 * Flow: flip status back to 'pending', clear any prior error, fire the edge
 * function. The indexer itself wipes old chunks before inserting new ones
 * (see the DELETE then INSERT in `supabase/functions/vault-indexer/index.ts`).
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireStaff } from '@/lib/auth';
import { vaultUploadLimiter, triggerIndexer } from '../../route';
import type { VaultDocument } from '@/lib/vault/types';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export const POST = requireStaff(async (req: NextRequest, ctx?: Ctx) => {
  // Share the upload limiter — re-indexing also costs embedding calls.
  const limited = vaultUploadLimiter.check(req);
  if (limited) return limited;

  const { id } = await ctx!.params;
  const sb = adminClient();

  const { data: current, error: loadErr } = await sb
    .from('vault_documents')
    .select('status')
    .eq('id', id)
    .single<{ status: string }>();
  if (loadErr || !current) {
    return NextResponse.json({ error: loadErr?.message ?? 'Not found' }, { status: 404 });
  }

  // RESUME vs RESTART:
  //  • mid-flight ('extracting'/'embedding') → RESUME. Keep status + chunks +
  //    extract_cursor intact and just re-fire the indexer; it continues from
  //    the watermark, which (thanks to the pre-claimed cursor) is already past
  //    any page that crashed the worker. This is what un-freezes a doc whose
  //    auto-continuation was killed by an OOM. We only touch updated_at so the
  //    stall detector resets.
  //  • otherwise ('ready'/'failed'/'pending') → RESTART from scratch.
  const midFlight = current.status === 'extracting' || current.status === 'embedding';
  const patch = midFlight
    ? { status: current.status }                                  // touch updated_at only
    : { status: 'pending', status_error: null, chunk_count: 0 };  // full restart

  const { data, error } = await sb
    .from('vault_documents')
    .update(patch)
    .eq('id', id)
    .select()
    .single<VaultDocument>();
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: 500 });
  }

  triggerIndexer(id);

  return NextResponse.json({ document: data });
});
