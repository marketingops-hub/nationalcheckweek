/**
 * MCP tool: upload_vault_document
 *
 * Lets Claude (via the NCIW connector) add paste / URL / small-file documents
 * to the research vault. Title + tags are mandatory and quality-checked so
 * uploads stay findable — Claude must ask the user for a real title and tags
 * before calling this tool.
 */

import { createHash, randomUUID } from 'crypto';
import { adminClient } from '@/lib/adminClient';
import { VAULT_CATEGORIES } from '@/lib/vault/categories';
import {
  MIME_TO_KIND,
  UPLOAD_LIMITS,
} from '@/lib/vault/schemas';
import type { DocumentKind, VaultDocument } from '@/lib/vault/types';

const STORAGE_BUCKET = 'vault';
/** Stay under Vercel’s ~4.5 MB body limit for base64 file uploads. */
const MAX_MCP_FILE_BYTES = 3 * 1024 * 1024;

const GENERIC_TITLE =
  /^(untitled(\s+document)?|document|doc|file|paste|test|new\s*document|n\/?a|temp|draft)$/i;

export const UPLOAD_VAULT_TOOL = {
  name: 'upload_vault_document',
  description:
    'Upload a document into the NCIW research vault (paste text, a public URL, or a small file). ' +
    'REQUIRED before calling: ask the user for a proper descriptive title AND at least one meaningful tag. ' +
    'Do NOT invent placeholder titles ("Untitled", "Document", "test") or empty tags — the tool rejects them. ' +
    'After upload the document indexes asynchronously (status starts as pending → ready). ' +
    'Prefer kind=paste for text you already have; kind=url to crawl a public page; kind=file for PDF/DOCX/TXT/MD as base64 (max 3 MB).',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description:
          'Descriptive document title (min 5 chars). Must come from the user — not a generic placeholder.',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description:
          'At least one meaningful tag (e.g. "anxiety", "AIHW", "statistics"). Ask the user if unsure.',
      },
      kind: {
        type: 'string',
        enum: ['paste', 'url', 'file'],
        description: 'How the content is supplied',
      },
      content: {
        type: 'string',
        description: 'Required when kind=paste — the full text to index',
      },
      url: {
        type: 'string',
        description: 'Required when kind=url — public https URL to crawl',
      },
      content_base64: {
        type: 'string',
        description: 'Required when kind=file — base64-encoded file bytes (max 3 MB decoded)',
      },
      filename: {
        type: 'string',
        description: 'Required when kind=file — original filename including extension',
      },
      mime: {
        type: 'string',
        description:
          'Required when kind=file — MIME type (application/pdf, DOCX, text/plain, text/markdown)',
      },
      category: {
        type: 'string',
        description: `Optional category. Suggested: ${VAULT_CATEGORIES.join(', ')}`,
      },
      author: { type: 'string', description: 'Optional citation author' },
      publisher: { type: 'string', description: 'Optional publisher' },
      year: { type: 'string', description: 'Optional year, e.g. "2024" or "n.d."' },
      source_url: { type: 'string', description: 'Optional canonical public URL for citations' },
      reference: { type: 'string', description: 'Optional full citation override' },
      page_ref: { type: 'string', description: 'Optional page/locator, e.g. "p. 14"' },
      source: { type: 'string', description: 'Optional source label (paste kind)' },
    },
    required: ['title', 'tags', 'kind'],
  },
} as const;

export type UploadVaultArgs = {
  title?: unknown;
  tags?: unknown;
  kind?: unknown;
  content?: unknown;
  url?: unknown;
  content_base64?: unknown;
  filename?: unknown;
  mime?: unknown;
  category?: unknown;
  author?: unknown;
  publisher?: unknown;
  year?: unknown;
  source_url?: unknown;
  reference?: unknown;
  page_ref?: unknown;
  source?: unknown;
};

export type UploadAuth = {
  userId: string | null;
  /** Space-delimited OAuth scopes; legacy API key is treated as full access. */
  scope: string;
  viaLegacyKey: boolean;
};

/** Exported for unit tests. */
export function validateTitleAndTags(
  titleRaw: unknown,
  tagsRaw: unknown,
): { ok: true; title: string; tags: string[] } | { ok: false; error: string } {
  if (typeof titleRaw !== 'string' || !titleRaw.trim()) {
    return {
      ok: false,
      error:
        'title is required. Ask the user for a proper descriptive title before uploading.',
    };
  }
  const title = titleRaw.trim();
  if (title.length < 5) {
    return {
      ok: false,
      error: 'title must be at least 5 characters. Ask the user for a more descriptive title.',
    };
  }
  if (title.length > 500) {
    return { ok: false, error: 'title must be at most 500 characters.' };
  }
  if (GENERIC_TITLE.test(title)) {
    return {
      ok: false,
      error:
        `title "${title}" is too generic. Ask the user for a proper descriptive title ` +
        '(e.g. "AIHW Youth Mental Health Report 2024").',
    };
  }

  if (!Array.isArray(tagsRaw) || tagsRaw.length === 0) {
    return {
      ok: false,
      error:
        'tags is required (non-empty array). Ask the user for at least one meaningful tag ' +
        'before uploading (e.g. ["mental health", "statistics"]).',
    };
  }

  const tags: string[] = [];
  const seen = new Set<string>();
  for (const t of tagsRaw) {
    if (typeof t !== 'string') {
      return { ok: false, error: 'each tag must be a string.' };
    }
    const tag = t.trim();
    if (!tag) continue;
    if (tag.length < 2) {
      return {
        ok: false,
        error: `tag "${tag}" is too short — tags must be at least 2 characters.`,
      };
    }
    if (tag.length > 50) {
      return { ok: false, error: `tag "${tag.slice(0, 20)}…" exceeds 50 characters.` };
    }
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length >= 20) break;
  }

  if (tags.length === 0) {
    return {
      ok: false,
      error:
        'tags must include at least one non-empty tag. Ask the user for meaningful tags.',
    };
  }

  return { ok: true, title, tags };
}

function optString(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;
  return s.slice(0, max);
}

function citationFields(args: UploadVaultArgs) {
  return {
    reference: optString(args.reference, 500),
    author: optString(args.author, 300),
    publisher: optString(args.publisher, 300),
    year: optString(args.year, 20),
    source_url: optString(args.source_url, 2000),
    page_ref: optString(args.page_ref, 120),
  };
}

function triggerIndexer(document_id: string): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.EDGE_SHARED_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('[mcp:vault-upload] Missing Supabase env — cannot trigger indexer.');
    return;
  }
  fetch(`${url}/functions/v1/vault-indexer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ document_id }),
  }).catch((err) => {
    console.error('[mcp:vault-upload] indexer trigger failed:', err);
  });
}

function hasWriteScope(auth: UploadAuth): boolean {
  if (auth.viaLegacyKey) return true;
  const scopes = auth.scope.split(/\s+/).filter(Boolean);
  return scopes.includes('vault:write');
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'url';
  }
}

async function checkMagicBytes(
  bytes: Uint8Array,
  mime: string,
): Promise<string | null> {
  const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46];
  const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];
  const startsWith = (magic: number[]) => magic.every((b, i) => bytes[i] === b);

  if (mime === 'application/pdf') {
    if (!startsWith(PDF_MAGIC)) return 'File does not appear to be a valid PDF.';
  } else if (
    mime ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    if (!startsWith(ZIP_MAGIC)) return 'File does not appear to be a valid DOCX.';
  }
  return null;
}

export async function callUploadVaultDocument(
  args: UploadVaultArgs,
  auth: UploadAuth,
): Promise<object> {
  if (!hasWriteScope(auth)) {
    return {
      error:
        'Missing vault:write scope. Re-authorize the connector (sign out of the ' +
        'NCIW connector in Claude and connect again) so the token includes write access.',
    };
  }

  const meta = validateTitleAndTags(args.title, args.tags);
  if (!meta.ok) return { error: meta.error };

  const kind = args.kind;
  if (kind !== 'paste' && kind !== 'url' && kind !== 'file') {
    return { error: 'kind must be one of: paste, url, file.' };
  }

  const category =
    optString(args.category, 100) || 'general';
  const cite = citationFields(args);
  const sb = adminClient();

  if (kind === 'paste') {
    const content = typeof args.content === 'string' ? args.content.trim() : '';
    if (!content) {
      return { error: 'content is required when kind=paste.' };
    }
    if (content.length > 500_000) {
      return { error: 'content exceeds the 500,000 character limit.' };
    }

    const file_hash = createHash('sha256').update(content).digest('hex');
    const { data: dupe } = await sb
      .from('vault_documents')
      .select('id, title')
      .eq('file_hash', file_hash)
      .maybeSingle();
    if (dupe) {
      return {
        error: `This exact text is already in the vault as "${dupe.title}".`,
        existing_id: dupe.id,
      };
    }

    const { data: doc, error } = await sb
      .from('vault_documents')
      .insert({
        title: meta.title,
        kind: 'paste' as DocumentKind,
        source: optString(args.source, 500),
        category,
        tags: meta.tags,
        status: 'pending',
        raw_text: content,
        file_hash,
        byte_size: Buffer.byteLength(content, 'utf8'),
        ...cite,
        added_by: auth.userId,
      })
      .select(
        'id, title, kind, category, tags, status, author, year, source_url, created_at',
      )
      .single<Pick<
        VaultDocument,
        | 'id'
        | 'title'
        | 'kind'
        | 'category'
        | 'tags'
        | 'status'
        | 'author'
        | 'year'
        | 'source_url'
        | 'created_at'
     >>();

    if (error || !doc) {
      console.error('[mcp:vault-upload] paste insert:', error?.message);
      return { error: 'Failed to create document.' };
    }
    triggerIndexer(doc.id);
    return {
      ok: true,
      document: doc,
      note: 'Indexing started. Poll list_documents / get_document until status is ready (or failed).',
    };
  }

  if (kind === 'url') {
    const url = typeof args.url === 'string' ? args.url.trim() : '';
    if (!url) return { error: 'url is required when kind=url.' };
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return { error: 'url must be a valid absolute URL.' };
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { error: 'url must use http or https.' };
    }
    if (url.length > 2000) return { error: 'url exceeds 2000 characters.' };

    const { data: dupe } = await sb
      .from('vault_documents')
      .select('id, title')
      .eq('source', url)
      .maybeSingle();
    if (dupe) {
      return {
        error: `That URL is already in the vault as "${dupe.title}".`,
        existing_id: dupe.id,
      };
    }

    const { data: doc, error } = await sb
      .from('vault_documents')
      .insert({
        title: meta.title || `Untitled (${extractHostname(url)})`,
        kind: 'url' as DocumentKind,
        source: url,
        category,
        tags: meta.tags,
        status: 'pending',
        ...cite,
        added_by: auth.userId,
      })
      .select(
        'id, title, kind, category, tags, status, author, year, source_url, created_at',
      )
      .single();

    if (error || !doc) {
      console.error('[mcp:vault-upload] url insert:', error?.message);
      return { error: 'Failed to create document.' };
    }
    triggerIndexer(doc.id);
    return {
      ok: true,
      document: doc,
      note: 'Crawl + indexing started. Poll until status is ready (or failed).',
    };
  }

  // kind === 'file'
  const mime = typeof args.mime === 'string' ? args.mime.trim() : '';
  const filename =
    typeof args.filename === 'string' ? args.filename.trim() : '';
  const b64 =
    typeof args.content_base64 === 'string'
      ? args.content_base64.replace(/\s+/g, '')
      : '';

  if (!mime || !filename || !b64) {
    return {
      error:
        'kind=file requires mime, filename, and content_base64. For larger files use the admin Vault UI.',
    };
  }
  if (!UPLOAD_LIMITS.ALLOWED_MIME.has(mime)) {
    return {
      error: `Unsupported MIME '${mime}'. Accepted: PDF, DOCX, TXT, MD.`,
    };
  }

  let bytes: Buffer;
  try {
    bytes = Buffer.from(b64, 'base64');
  } catch {
    return { error: 'content_base64 is not valid base64.' };
  }
  if (bytes.length === 0) return { error: 'Decoded file is empty.' };
  if (bytes.length > MAX_MCP_FILE_BYTES) {
    return {
      error: `File is too large for MCP upload (max ${MAX_MCP_FILE_BYTES / 1024 / 1024} MB). Use the admin Vault UI for larger files.`,
    };
  }

  const magicErr = await checkMagicBytes(new Uint8Array(bytes), mime);
  if (magicErr) return { error: magicErr };

  const fileKind: DocumentKind = MIME_TO_KIND[mime];
  const file_hash = createHash('sha256').update(bytes).digest('hex');
  const { data: dupe } = await sb
    .from('vault_documents')
    .select('id, title')
    .eq('file_hash', file_hash)
    .maybeSingle();
  if (dupe) {
    return {
      error: `This file is already in the vault as "${dupe.title}".`,
      existing_id: dupe.id,
    };
  }

  const filenameSafe = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  const storage_path = `docs/${randomUUID()}-${filenameSafe}`;

  const { error: upErr } = await sb.storage
    .from(STORAGE_BUCKET)
    .upload(storage_path, bytes, { contentType: mime, upsert: false });
  if (upErr) {
    console.error('[mcp:vault-upload] storage:', upErr.message);
    return { error: 'Storage upload failed.' };
  }

  const { data: doc, error: insErr } = await sb
    .from('vault_documents')
    .insert({
      title: meta.title,
      kind: fileKind,
      source: filename,
      storage_path,
      category,
      tags: meta.tags,
      status: 'pending',
      file_hash,
      byte_size: bytes.length,
      ...cite,
      added_by: auth.userId,
    })
    .select(
      'id, title, kind, category, tags, status, author, year, source_url, created_at',
    )
    .single();

  if (insErr || !doc) {
    await sb.storage.from(STORAGE_BUCKET).remove([storage_path]);
    console.error('[mcp:vault-upload] file insert:', insErr?.message);
    return { error: 'Failed to create document.' };
  }

  triggerIndexer(doc.id);
  return {
    ok: true,
    document: doc,
    note: 'Indexing started. Poll until status is ready (or failed).',
  };
}
