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
import { randomUUID, createHash } from 'crypto';
import { adminClient } from '@/lib/adminClient';
import { requireStaff, type AuthedRequest } from '@/lib/auth';
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

export const GET = requireStaff(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const status   = searchParams.get('status');
  const kind     = searchParams.get('kind');
  const category = searchParams.get('category');
  const search   = searchParams.get('search')?.trim();
  const limit    = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 500);

  const sb = adminClient();
  let q = sb
    .from('vault_documents')
    .select('id, title, kind, source, reference, author, publisher, year, source_url, page_ref, storage_path, category, tags, status, status_error, char_count, chunk_count, token_count, page_count, byte_size, file_hash, use_count, last_used_at, added_by, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status)   q = q.eq('status', status);
  if (kind)     q = q.eq('kind', kind);
  if (category) q = q.eq('category', category);
  if (search) {
    // Title-and-source ilike search. Keeps the query simple; for more advanced
    // needs we'll move to the chunks-level vector search already wired up.
    //   • escape % and _ so they're literal in LIKE
    //   • strip , ( ) " which are PostgREST .or() syntax — an un-stripped comma
    //     would split the term into bogus extra filter conditions (broken query
    //     / filter injection), not a literal search.
    const term = search.replace(/[%_]/g, '\\$&').replace(/[,()"]/g, ' ').trim();
    const like = `%${term}%`;
    q = q.or(`title.ilike.${like},source.ilike.${like}`);
  }

  const { data, error } = await q;
  if (error) {
    console.error('[vault:list]', error.message);
    return NextResponse.json({ error: 'Failed to fetch documents.' }, { status: 500 });
  }
  return NextResponse.json({ documents: data ?? [] });
});

/* ─── POST ─────────────────────────────────────────────────────────────── */

export const POST = requireStaff(async (req: NextRequest) => {
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

  // Verify magic bytes so a renamed file can't masquerade as a safe type.
  const magicError = await checkMagicBytes(file);
  if (magicError) {
    return NextResponse.json({ error: magicError }, { status: 415 });
  }

  const kind: DocumentKind = MIME_TO_KIND[file.type];

  // Metadata fields (title, category, tags) come as form strings.
  const metaParsed = FileUploadMetaSchema.safeParse({
    title:      form.get('title') ?? undefined,
    reference:  form.get('reference') ?? undefined,
    author:     form.get('author') ?? undefined,
    publisher:  form.get('publisher') ?? undefined,
    year:       form.get('year') ?? undefined,
    source_url: form.get('source_url') ?? undefined,
    page_ref:   form.get('page_ref') ?? undefined,
    category:   form.get('category') ?? 'general',
    tags:       form.get('tags') ?? undefined,
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

  // Duplicate detection: a file with identical bytes is already in the vault.
  // Block it so the same source can't double its retrieval weight / cost.
  const file_hash = createHash('sha256').update(Buffer.from(bytes)).digest('hex');
  const { data: dupe } = await sb
    .from('vault_documents')
    .select('id, title')
    .eq('file_hash', file_hash)
    .maybeSingle();
  if (dupe) {
    return NextResponse.json(
      { error: `This file is already in the vault as "${dupe.title}". Delete that first to replace it.`, existing_id: dupe.id },
      { status: 409 },
    );
  }

  const { error: upErr } = await sb.storage
    .from(STORAGE_BUCKET)
    .upload(storage_path, bytes, { contentType: file.type, upsert: false });
  if (upErr) {
    console.error('[vault:upload] storage error:', upErr.message);
    return NextResponse.json({ error: 'Storage upload failed.' }, { status: 500 });
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
      file_hash,
      byte_size: file.size,
      reference:  metaParsed.data.reference  ?? null,
      author:     metaParsed.data.author     ?? null,
      publisher:  metaParsed.data.publisher  ?? null,
      year:       metaParsed.data.year        ?? null,
      source_url: metaParsed.data.source_url ?? null,
      page_ref:   metaParsed.data.page_ref   ?? null,
      added_by: (req as AuthedRequest).user.id,
    })
    .select()
    .single<VaultDocument>();
  if (insErr || !doc) {
    // Roll back the storage upload so we don't leak orphan files.
    await sb.storage.from(STORAGE_BUCKET).remove([storage_path]);
    console.error('[vault:upload] insert error:', insErr?.message);
    return NextResponse.json({ error: 'Failed to create document.' }, { status: 500 });
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
    // Duplicate detection on the pasted text.
    const file_hash = createHash('sha256').update(parsed.data.content).digest('hex');
    const { data: dupe } = await sb
      .from('vault_documents')
      .select('id, title')
      .eq('file_hash', file_hash)
      .maybeSingle();
    if (dupe) {
      return NextResponse.json(
        { error: `This exact text is already in the vault as "${dupe.title}".`, existing_id: dupe.id },
        { status: 409 },
      );
    }
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
        file_hash,
        byte_size: Buffer.byteLength(parsed.data.content, 'utf8'),
        reference:  parsed.data.reference  ?? null,
        author:     parsed.data.author     ?? null,
        publisher:  parsed.data.publisher  ?? null,
        year:       parsed.data.year        ?? null,
        source_url: parsed.data.source_url ?? null,
        page_ref:   parsed.data.page_ref   ?? null,
        added_by:  (req as AuthedRequest).user.id,
      })
      .select()
      .single<VaultDocument>();
    if (error || !doc) {
      console.error('[vault:paste] insert error:', error?.message);
      return NextResponse.json({ error: 'Failed to create document.' }, { status: 500 });
    }
    triggerIndexer(doc.id);
    return NextResponse.json({ document: doc }, { status: 201 });
  }

  // kind === 'url' — duplicate detection on the exact source URL.
  {
    const { data: dupe } = await sb
      .from('vault_documents')
      .select('id, title')
      .eq('source', parsed.data.url)
      .maybeSingle();
    if (dupe) {
      return NextResponse.json(
        { error: `That URL is already in the vault as "${dupe.title}".`, existing_id: dupe.id },
        { status: 409 },
      );
    }
  }
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
      reference:  parsed.data.reference  ?? null,
      author:     parsed.data.author     ?? null,
      publisher:  parsed.data.publisher  ?? null,
      year:       parsed.data.year        ?? null,
      source_url: parsed.data.source_url ?? null,
      page_ref:   parsed.data.page_ref   ?? null,
      added_by: (req as AuthedRequest).user.id,
    })
    .select()
    .single<VaultDocument>();
  if (error || !doc) {
    console.error('[vault:url] insert error:', error?.message);
    return NextResponse.json({ error: 'Failed to create document.' }, { status: 500 });
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
  // Prefer the shared secret (vault-indexer now runs with verify_jwt off and
  // checks EDGE_SHARED_SECRET, matching its own self-trigger). Fall back to the
  // service key. See the content-creator callEdge for the same pattern.
  const key = process.env.EDGE_SHARED_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
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

/* ─── Magic-bytes validation ──────────────────────────────────────────── */

// Returns an error string if bytes don't match the declared MIME, null if OK.
async function checkMagicBytes(file: File): Promise<string | null> {
  const PDF_MAGIC  = [0x25, 0x50, 0x44, 0x46]; // %PDF
  const ZIP_MAGIC  = [0x50, 0x4B, 0x03, 0x04]; // PK\x03\x04 — DOCX is a zip

  const buf = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buf);

  const startsWith = (magic: number[]) => magic.every((b, i) => bytes[i] === b);

  if (file.type === 'application/pdf') {
    if (!startsWith(PDF_MAGIC)) return 'File does not appear to be a valid PDF.';
  } else if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    if (!startsWith(ZIP_MAGIC)) return 'File does not appear to be a valid DOCX.';
  }
  // TXT and MD have no reliable magic bytes — trust the MIME allowlist check above.
  return null;
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
