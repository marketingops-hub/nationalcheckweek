/* ═══════════════════════════════════════════════════════════════════════════
 * /api/admin/vault/documents/[id]
 *
 * GET    → document row + chunk previews (for the detail page)
 * PATCH  → edit title / category / tags only. Content is immutable; to change
 *          text, delete + re-upload.
 * DELETE → remove the document, cascade-delete its chunks, remove the file
 *          from Supabase Storage.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { PatchDocumentSchema } from '@/lib/vault/schemas';
import type { VaultDocument } from '@/lib/vault/types';

export const runtime = 'nodejs';

const STORAGE_BUCKET = 'vault';

type Ctx = { params: Promise<{ id: string }> };

/* ─── GET ─────────────────────────────────────────────────────────────── */

export const GET = requireAdmin(async (_req: NextRequest, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();

  const { data: doc, error: docErr } = await sb
    .from('vault_documents')
    .select('*')
    .eq('id', id)
    .single<VaultDocument>();
  if (docErr || !doc) {
    return NextResponse.json({ error: docErr?.message ?? 'Not found' }, { status: 404 });
  }

  // Pull a preview of chunks — index + token_count + content. We intentionally
  // skip the embedding vector to keep the response small. The detail page
  // truncates content client-side when collapsed.
  const { data: chunks, error: chErr } = await sb
    .from('vault_chunks')
    .select('id, chunk_index, content, token_count')
    .eq('document_id', id)
    .order('chunk_index', { ascending: true });
  if (chErr) {
    return NextResponse.json({ error: chErr.message }, { status: 500 });
  }

  return NextResponse.json({ document: { ...doc, chunks: chunks ?? [] } });
});

/* ─── PATCH ───────────────────────────────────────────────────────────── */

export const PATCH = requireAdmin(async (req: NextRequest, ctx?: Ctx) => {
  const { id } = await ctx!.params;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }

  const parsed = PatchDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
  }

  const sb = adminClient();
  const { data, error } = await sb
    .from('vault_documents')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single<VaultDocument>();
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Update failed' },
      { status: 500 },
    );
  }

  return NextResponse.json({ document: data });
});

/* ─── DELETE ──────────────────────────────────────────────────────────── */

export const DELETE = requireAdmin(async (_req: NextRequest, ctx?: Ctx) => {
  const { id } = await ctx!.params;
  const sb = adminClient();

  // Fetch first so we know the storage_path to remove.
  const { data: doc, error: loadErr } = await sb
    .from('vault_documents')
    .select('id, storage_path')
    .eq('id', id)
    .single<Pick<VaultDocument, 'id' | 'storage_path'>>();
  if (loadErr || !doc) {
    return NextResponse.json({ error: loadErr?.message ?? 'Not found' }, { status: 404 });
  }

  // Delete the row — vault_chunks will cascade via the FK (ON DELETE CASCADE).
  const { error: delErr } = await sb.from('vault_documents').delete().eq('id', id);
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  // Best-effort file cleanup; don't fail the request if the file is already
  // gone or the bucket doesn't exist. The row is the source of truth.
  if (doc.storage_path) {
    const { error: rmErr } = await sb.storage
      .from(STORAGE_BUCKET)
      .remove([doc.storage_path]);
    if (rmErr) {
      console.warn(`[vault] failed to remove ${doc.storage_path}: ${rmErr.message}`);
    }
  }

  return NextResponse.json({ ok: true });
});
