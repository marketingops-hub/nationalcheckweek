/* ═══════════════════════════════════════════════════════════════════════════
 * /api/admin/vault/documents
 *
 * GET  → list documents with filtering (status, kind, category, search).
 * POST → create a document + trigger the indexer edge fn. Accepts either:
 *          • multipart/form-data with a `file` field (PDF / DOCX / TXT)
 *          • application/json matching CreateDocumentSchema (paste | url)
 *
 * The POST path does the minimum synchronous work:
 *   1. Validate input
 *   2. Upload file to Supabase Storage (for file uploads) OR write raw_text
 *   3. Insert vault_documents row with status='pending'
 *   4. Fire-and-forget POST to the vault-indexer edge function
 *
 * Returns the new document row immediately; the UI polls for status updates.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { create as createLimiter } from '@/lib/rateLimit';
import {
  CreateDocumentSchema,
  FileUploadMetaSchema,
  UPLOAD_LIMITS,
  MIME_TO_KIND,
} from '@/lib/vault/schemas';
import type { VaultDocument, DocumentKind } from '@/lib/vault/types';

export const runtime = 'nodejs';
// File uploads + indexer trigger can take a few seconds; give headroom.
export const maxDuration = 60;

const STORAGE_BUCKET = 'vault';

// Cheap-ish operations (insert + edge fn trigger) but embeddings cost real $$.
// 100 uploads / admin / hour is plenty for a content team and caps abuse.
export const vaultUploadLimiter = createLimiter('vault-upload', {
  limit: 100,
  windowSeconds: 60 * 60,
});

/* ─── GET ──────────────────────────────────────────────────────────────── */

export const GET = requireAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const status   = searchParams.get('status');
  const kind     = searchParams.get('kind');
  const category = searchParams.get('category');
  const search   = searchParams.get('search')?.trim();
  const limit    = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 500);

  const sb = adminClient();
  let q = sb
    .from('vault_documents')
    .select('id, title, kind, source, storage_path, category, tags, status, status_error, char_count, chunk_count, token_count, added_by, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status)   q = q.eq('status', status);
  if (kind)     q = q.eq('kind', kind);
  if (category) q = q.eq('category', category);
  if (search) {
    // Title-and-source ilike search. Keeps the query simple; for more advanced
    // needs we'll move to the chunks-level vector search already wired up.
    const like = `%${search.replace(/[%_]/g, '\\$&')}%`;
    q = q.or(`title.ilike.${like},source.ilike.${like}`);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documents: data ?? [] });
});

/* ─── POST ─────────────────────────────────────────────────────────────── */

export const POST = requireAdmin(async (req: NextRequest) => {
  const limited = vaultUploadLimiter.check(req);
  if (limited) return limited;

  const contentType = req.headers.get('content-type') ?? '';

  try {
    if (contentType.startsWith('multipart/form-data')) {
      return await handleFileUpload(req);
    }
    if (contentType.startsWith('application/json')) {
      return await handleJsonCreate(req);
    }
    return NextResponse.json(
      { error: `Unsupported content-type '${contentType}'. Use multipart or JSON.` },
      { status: 415 },
    );
  } catch (err) {
    // Any unexpected crash should still return structured JSON.
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});

/* ─── Branch: multipart file upload ──────────────────────────────────────── */

async function handleFileUpload(req: NextRequest): Promise<NextResponse> {
  const form = await req.formData();

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Form field `file` is required.' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty.' }, { status: 400 });
  }
  if (file.size > UPLOAD_LIMITS.MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `File is too large (max ${UPLOAD_LIMITS.MAX_FILE_BYTES / 1024 / 1024} MB).` },
      { status: 413 },
    );
  }
  if (!UPLOAD_LIMITS.ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported MIME '${file.type}'. Accepted: PDF, DOCX, TXT, MD.` },
      { status: 415 },
    );
  }

  const kind: DocumentKind = MIME_TO_KIND[file.type];

  // Metadata fields (title, category, tags) come as form strings.
  const metaParsed = FileUploadMetaSchema.safeParse({
    title:    form.get('title') ?? undefined,
    category: form.get('category') ?? 'general',
    tags:     form.get('tags') ?? undefined,
  });
  if (!metaParsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: metaParsed.error.issues },
      { status: 400 },
    );
  }
  const tags = parseTags(metaParsed.data.tags);

  const sb = adminClient();

  // 1. Upload the raw bytes to Supabase Storage under `docs/<uuid>-<filename>`.
  //    UUID prefix avoids filename collisions and makes deletes predictable.
  const filenameSafe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  const storage_path = `docs/${randomUUID()}-${filenameSafe}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: upErr } = await sb.storage
    .from(STORAGE_BUCKET)
    .upload(storage_path, bytes, { contentType: file.type, upsert: false });
  if (upErr) {
    return NextResponse.json(
      { error: `Storage upload failed: ${upErr.message}` },
      { status: 500 },
    );
  }

  // 2. Insert the document row.
  const title = metaParsed.data.title?.trim() || deriveTitleFromFilename(file.name);
  const { data: doc, error: insErr } = await sb
    .from('vault_documents')
    .insert({
      title,
      kind,
      source: file.name,
      storage_path,
      category: metaParsed.data.category,
      tags,
      status: 'pending',
    })
    .select()
    .single<VaultDocument>();
  if (insErr || !doc) {
    // Roll back the storage upload so we don't leak orphan files.
    await sb.storage.from(STORAGE_BUCKET).remove([storage_path]);
    return NextResponse.json(
      { error: `Document insert failed: ${insErr?.message ?? 'no row'}` },
      { status: 500 },
    );
  }

  // 3. Trigger the indexer (fire-and-forget — UI polls status).
  triggerIndexer(doc.id);

  return NextResponse.json({ document: doc }, { status: 201 });
}

/* ─── Branch: JSON create (paste or url) ─────────────────────────────────── */

async function handleJsonCreate(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }

  const parsed = CreateDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const sb = adminClient();

  if (parsed.data.kind === 'paste') {
    const { data: doc, error } = await sb
      .from('vault_documents')
      .insert({
        title:     parsed.data.title,
        kind:      'paste',
        source:    parsed.data.source ?? null,
        category:  parsed.data.category,
        tags:      parsed.data.tags,
        status:    'pending',
        raw_text:  parsed.data.content,
      })
      .select()
      .single<VaultDocument>();
    if (error || !doc) {
      return NextResponse.json(
        { error: `Document insert failed: ${error?.message ?? 'no row'}` },
        { status: 500 },
      );
    }
    triggerIndexer(doc.id);
    return NextResponse.json({ document: doc }, { status: 201 });
  }

  // kind === 'url'
  const { data: doc, error } = await sb
    .from('vault_documents')
    .insert({
      // Title is filled synchronously here if the admin provided it; otherwise
      // the indexer will auto-fill from Firecrawl metadata on first run.
      title:    parsed.data.title ?? `Untitled (${extractHostname(parsed.data.url)})`,
      kind:     'url',
      source:   parsed.data.url,
      category: parsed.data.category,
      tags:     parsed.data.tags,
      status:   'pending',
    })
    .select()
    .single<VaultDocument>();
  if (error || !doc) {
    return NextResponse.json(
      { error: `Document insert failed: ${error?.message ?? 'no row'}` },
      { status: 500 },
    );
  }
  triggerIndexer(doc.id);
  return NextResponse.json({ document: doc }, { status: 201 });
}

/* ─── Indexer trigger (fire-and-forget) ───────────────────────────────── */

/**
 * Kick off the vault-indexer edge function. We deliberately do NOT await it —
 * extraction + chunking + embedding can take 30s+ for a big PDF, and the
 * client just needs the document row back to start polling.
 *
 * Errors are swallowed because the indexer itself updates status='failed' on
 * any internal throw. If the trigger fetch itself fails (network blip), the
 * row stays in 'pending' and the admin can hit Re-index.
 */
export function triggerIndexer(document_id: string): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('[vault-indexer] Missing Supabase env vars — cannot trigger.');
    return;
  }

  // Intentional lack of await.
  fetch(`${url}/functions/v1/vault-indexer`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({ document_id }),
  }).catch((err) => {
    console.error('[vault-indexer] trigger failed:', err);
  });
}

/* ─── helpers ─────────────────────────────────────────────────────────── */

function parseTags(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 50)
    .slice(0, 20);
}

function deriveTitleFromFilename(name: string): string {
  const base = name.replace(/\.(pdf|docx|txt|md)$/i, '');
  return base.replace(/[_-]+/g, ' ').trim().slice(0, 500) || 'Untitled document';
}

function extractHostname(url: string): string {
  try { return new URL(url).hostname; }
  catch { return 'url'; }
}
