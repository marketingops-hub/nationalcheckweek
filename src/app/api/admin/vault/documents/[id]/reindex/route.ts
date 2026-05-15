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
import { requireAdmin } from '@/lib/auth';
import { vaultUploadLimiter, triggerIndexer } from '../../route';
import type { VaultDocument } from '@/lib/vault/types';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export const POST = requireAdmin(async (req: NextRequest, ctx?: Ctx) => {
  // Share the upload limiter — re-indexing also costs embedding calls.
  const limited = vaultUploadLimiter.check(req);
  if (limited) return limited;

  const { id } = await ctx!.params;
  const sb = adminClient();

  // Reset status; keep raw_text / storage_path intact so the indexer has
  // something to work with. chunk_count is zeroed because the indexer will
  // wipe existing chunks before inserting new ones.
  const { data, error } = await sb
    .from('vault_documents')
    .update({ status: 'pending', status_error: null, chunk_count: 0 })
    .eq('id', id)
    .select()
    .single<VaultDocument>();
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Not found' },
      { status: 404 },
    );
  }

  triggerIndexer(id);

  return NextResponse.json({ document: data });
});
