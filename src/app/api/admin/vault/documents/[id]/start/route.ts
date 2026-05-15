/* ═══════════════════════════════════════════════════════════════════════════
 * POST /api/admin/vault/documents/[id]/start
 *
 * Step 3 of the direct-to-Storage flow. Once the browser has finished
 * uploading the file via the signed URL, it calls this endpoint to fire the
 * indexer. Separate from /reindex so the semantics are clear:
 *
 *   start   → first-time indexing of a freshly uploaded file
 *   reindex → re-run indexing on an already-ingested document
 *
 * Verifies the storage object actually exists before triggering, so we fail
 * loudly if the browser aborted mid-upload instead of silently queueing an
 * indexer call that'll fail deep inside the edge function.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { triggerIndexer } from '../../route';
import type { VaultDocument } from '@/lib/vault/types';

export const runtime = 'nodejs';

const STORAGE_BUCKET = 'vault';

type Ctx = { params: Promise<{ id: string }> };

export const POST = requireAdmin(async (_req: NextRequest, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();

  const { data: doc, error } = await sb
    .from('vault_documents')
    .select('*')
    .eq('id', id)
    .single<VaultDocument>();
  if (error || !doc) {
    return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: 404 });
  }

  if (!doc.storage_path) {
    return NextResponse.json(
      { error: 'This document has no storage_path — nothing to index.' },
      { status: 400 },
    );
  }

  // Confirm the object actually landed. `list()` on the parent folder with a
  // search filter is cheap and works without signed URLs. If the object is
  // missing, the client almost certainly aborted the upload.
  const folder   = doc.storage_path.split('/').slice(0, -1).join('/') || '';
  const filename = doc.storage_path.split('/').pop() ?? '';
  const { data: listing, error: listErr } = await sb.storage
    .from(STORAGE_BUCKET)
    .list(folder, { search: filename, limit: 1 });

  if (listErr) {
    return NextResponse.json(
      { error: `Storage check failed: ${listErr.message}` },
      { status: 500 },
    );
  }
  if (!listing || listing.length === 0) {
    return NextResponse.json(
      { error: 'Uploaded file not found in storage. The upload may have failed — please retry.' },
      { status: 409 },
    );
  }

  triggerIndexer(doc.id);
  return NextResponse.json({ document: doc });
});
