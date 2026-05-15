/* ═══════════════════════════════════════════════════════════════════════════
 * Client-side wrappers for the Vault admin API.
 *
 * Every UI component imports from here rather than calling `adminFetch`
 * directly — keeps auth / retry / JSON quirks in one place.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { adminFetch } from '@/lib/adminFetch';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { VaultDocument, VaultDocumentDetail, DocumentStatus, DocumentKind } from './types';

const BASE = '/api/admin/vault/documents';

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface ListFilters {
  status?:   DocumentStatus | 'all';
  kind?:     DocumentKind   | 'all';
  category?: string         | 'all';
  search?:   string;
  limit?:    number;
}

export async function listDocuments(filters: ListFilters = {}): Promise<VaultDocument[]> {
  const qs = new URLSearchParams();
  if (filters.status   && filters.status   !== 'all') qs.set('status',   filters.status);
  if (filters.kind     && filters.kind     !== 'all') qs.set('kind',     filters.kind);
  if (filters.category && filters.category !== 'all') qs.set('category', filters.category);
  if (filters.search)                                 qs.set('search',   filters.search);
  if (filters.limit)                                  qs.set('limit',    String(filters.limit));

  const res = await adminFetch(`${BASE}?${qs.toString()}`);
  const { documents } = await asJson<{ documents: VaultDocument[] }>(res);
  return documents;
}

export async function getDocument(id: string): Promise<VaultDocumentDetail> {
  const res = await adminFetch(`${BASE}/${id}`);
  const { document } = await asJson<{ document: VaultDocumentDetail }>(res);
  return document;
}

export interface PasteInput {
  kind:     'paste';
  title:    string;
  content:  string;
  source?:  string;
  category: string;
  tags:     string[];
}

export interface UrlInput {
  kind:     'url';
  url:      string;
  title?:   string;
  category: string;
  tags:     string[];
}

/** Non-file variants: paste or URL. */
export async function createDocument(input: PasteInput | UrlInput): Promise<VaultDocument> {
  const res = await adminFetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const { document } = await asJson<{ document: VaultDocument }>(res);
  return document;
}

export interface FileUploadInput {
  file:       File;
  title?:     string;
  category:   string;
  tags?:      string[];
  onProgress?: (pct: number) => void;   // 0..1, optional
}

/**
 * Three-step upload that bypasses Vercel's ~4.5 MB serverless body limit:
 *
 *   1. POST /upload-url   → get signed token + pre-insert document row
 *   2. PUT the file bytes direct to Supabase Storage (no Vercel hop)
 *   3. POST /[id]/start   → trigger the indexer
 *
 * If step 2 or 3 fails we attempt to clean up the orphan row so the library
 * doesn't fill with broken 'pending' entries.
 */
export async function uploadFile(input: FileUploadInput): Promise<VaultDocument> {
  // ── Step 1: signed URL + document row ────────────────────────────────
  const signRes = await adminFetch(`${BASE}/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: input.file.name,
      mime:     input.file.type || 'application/octet-stream',
      size:     input.file.size,
      title:    input.title,
      category: input.category,
      tags:     input.tags ?? [],
    }),
  });
  const { document, upload } = await asJson<{
    document: VaultDocument;
    upload:   { path: string; token: string; signed_url: string; bucket: string };
  }>(signRes);

  // ── Step 2: direct upload to Supabase Storage ────────────────────────
  try {
    const sb = createSupabaseBrowserClient();
    const { error } = await sb.storage
      .from(upload.bucket)
      .uploadToSignedUrl(upload.path, upload.token, input.file, {
        contentType: input.file.type || undefined,
        upsert: false,
      });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
  } catch (err) {
    // Clean up the orphan row so the library isn't polluted with pending
    // rows for uploads that never arrived. Best-effort; swallow errors.
    await adminFetch(`${BASE}/${document.id}`, { method: 'DELETE' }).catch(() => {});
    throw err;
  }

  // ── Step 3: tell the indexer to start ────────────────────────────────
  const startRes = await adminFetch(`${BASE}/${document.id}/start`, { method: 'POST' });
  const { document: ready } = await asJson<{ document: VaultDocument }>(startRes);
  return ready;
}

export async function patchDocument(
  id: string,
  patch: { title?: string; category?: string; tags?: string[] },
): Promise<VaultDocument> {
  const res = await adminFetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const { document } = await asJson<{ document: VaultDocument }>(res);
  return document;
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await adminFetch(`${BASE}/${id}`, { method: 'DELETE' });
  await asJson<{ ok: boolean }>(res);
}

export async function reindexDocument(id: string): Promise<VaultDocument> {
  const res = await adminFetch(`${BASE}/${id}/reindex`, { method: 'POST' });
  const { document } = await asJson<{ document: VaultDocument }>(res);
  return document;
}
