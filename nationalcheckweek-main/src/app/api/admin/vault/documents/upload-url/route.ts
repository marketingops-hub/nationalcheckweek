/* ═══════════════════════════════════════════════════════════════════════════
 * POST /api/admin/vault/documents/upload-url
 *
 * Step 1 of the direct-to-Storage upload flow. Avoids Vercel's ~4.5 MB
 * serverless request body limit by returning a signed upload URL so the
 * browser can ship bytes straight to Supabase Storage.
 *
 * Flow:
 *   Client → POST /upload-url { filename, mime, size, title?, category, tags }
 *   Server → validate + create vault_documents row (status='pending') +
 *            signed upload token for `docs/<uuid>-<safe-filename>`
 *   Client → supabase.storage.uploadToSignedUrl(path, token, file)
 *   Client → POST /api/admin/vault/documents/[id]/start   (kicks off indexer)
 *
 * If the browser never completes step 2 or 3, the row stays in 'pending' and
 * the admin can hit Re-index or delete it from the library.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import {
  SignedUploadRequestSchema,
  UPLOAD_LIMITS,
  MIME_TO_KIND,
} from '@/lib/vault/schemas';
import type { VaultDocument, DocumentKind } from '@/lib/vault/types';
import { vaultUploadLimiter } from '../route';

export const runtime = 'nodejs';

const STORAGE_BUCKET = 'vault';

export const POST = requireAdmin(async (req: NextRequest) => {
  const limited = vaultUploadLimiter.check(req);
  if (limited) return limited;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }

  const parsed = SignedUploadRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // `size` is validated inside SignedUploadRequestSchema (positive int, <= max).
  // We don't persist it — Storage enforces the actual byte limit at upload time.
  const { filename, mime, title, category, tags } = parsed.data;

  if (!UPLOAD_LIMITS.ALLOWED_MIME.has(mime)) {
    return NextResponse.json(
      { error: `Unsupported MIME '${mime}'. Accepted: PDF, DOCX, TXT, MD.` },
      { status: 415 },
    );
  }
  const kind: DocumentKind = MIME_TO_KIND[mime];

  const sb = adminClient();

  // Deterministic, collision-proof path. UUID prefix matters: the admin might
  // upload two files with the same filename and we don't want them overwriting.
  const filenameSafe = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  const storage_path = `docs/${randomUUID()}-${filenameSafe}`;

  // Ask Storage for a signed upload URL. The browser will PUT bytes here.
  // Token is valid for 2 hours — plenty for even a 100 MB file on a slow link.
  const { data: signed, error: signErr } = await sb.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(storage_path);

  if (signErr || !signed) {
    // Most common cause: bucket doesn't exist. Point the admin at the fix.
    const hint = /not\s*found/i.test(signErr?.message ?? '')
      ? ' — the `vault` storage bucket is missing. Run the 20260420000002_vault_rag.sql migration.'
      : '';
    return NextResponse.json(
      { error: `Could not create upload URL: ${signErr?.message ?? 'unknown'}${hint}` },
      { status: 500 },
    );
  }

  // Insert the row. Title defaults to a cleaned-up filename; the indexer may
  // overwrite it later (e.g. PDFs with embedded metadata titles).
  const { data: doc, error: insErr } = await sb
    .from('vault_documents')
    .insert({
      title:        title?.trim() || deriveTitleFromFilename(filename),
      kind,
      source:       filename,
      storage_path,
      category,
      tags,
      status:       'pending',
    })
    .select()
    .single<VaultDocument>();

  if (insErr || !doc) {
    // Best-effort: invalidate the signed URL-backed path so we don't leak
    // reserved storage keys. Storage may not actually store anything yet
    // (client hasn't uploaded), so this is almost always a no-op.
    await sb.storage.from(STORAGE_BUCKET).remove([storage_path]);
    return NextResponse.json(
      { error: `Document insert failed: ${insErr?.message ?? 'no row'}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    document:     doc,
    upload:       {
      path:       signed.path,        // = storage_path
      token:      signed.token,
      signed_url: signed.signedUrl,   // exposed for non-supabase-js clients
      bucket:     STORAGE_BUCKET,
    },
    // Size cap echoed back so the client can enforce consistently if needed.
    max_bytes:    UPLOAD_LIMITS.MAX_FILE_BYTES,
    ttl_seconds:  60 * 120,
  }, { status: 201 });
});

function deriveTitleFromFilename(name: string): string {
  const base = name.replace(/\.(pdf|docx|txt|md)$/i, '');
  return base.replace(/[_-]+/g, ' ').trim().slice(0, 500) || 'Untitled document';
}
