/* ═══════════════════════════════════════════════════════════════════════════
 * Vault RAG — Zod schemas.
 *
 * Two boundaries enforce validation:
 *   1. API routes (here) — reject malformed clients before any work happens.
 *   2. DB CHECK constraints (migration) — defence in depth.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { z } from 'zod';

const nonEmpty    = z.string().trim().min(1);
const titleSchema = nonEmpty.max(500);
const categorySchema = nonEmpty.max(100).default('general');
const tagsSchema  = z.array(z.string().trim().min(1).max(50)).max(20).default([]);

// Richer reference fields — all optional, used to render real citations.
const referenceSchema = z.string().trim().max(500).optional();   // manual full-citation override
const authorSchema    = z.string().trim().max(300).optional();   // "AIHW"
const publisherSchema = z.string().trim().max(300).optional();   // "Australian Institute of Health and Welfare"
const yearSchema      = z.string().trim().max(20).optional();    // "2024", "n.d."
const sourceUrlSchema = z.string().trim().max(2000).optional();  // canonical public link
const pageRefSchema   = z.string().trim().max(120).optional();   // "p. 14", "Table 3" (manual locator)

/** Reusable block of structured-citation fields shared across schemas. */
const citationFields = {
  reference:  referenceSchema,
  author:     authorSchema,
  publisher:  publisherSchema,
  year:       yearSchema,
  source_url: sourceUrlSchema,
  page_ref:   pageRefSchema,
};

/** POST /api/admin/vault/documents — paste variant. */
export const PasteDocumentSchema = z.object({
  kind:       z.literal('paste'),
  title:      titleSchema,
  content:    nonEmpty.max(500_000),   // ~125k tokens, hard ceiling before chunking
  source:     z.string().trim().max(500).optional(),
  ...citationFields,
  category:   categorySchema,
  tags:       tagsSchema,
});

/** POST /api/admin/vault/documents — url variant (crawled via Firecrawl). */
export const UrlDocumentSchema = z.object({
  kind:       z.literal('url'),
  url:        z.string().url().max(2000),
  title:      titleSchema.optional(),   // auto-filled from the crawl if omitted
  ...citationFields,
  category:   categorySchema,
  tags:       tagsSchema,
});

export const CreateDocumentSchema = z.discriminatedUnion('kind', [
  PasteDocumentSchema,
  UrlDocumentSchema,
]);

/** Multipart form fields that accompany a file upload. */
export const FileUploadMetaSchema = z.object({
  title:      titleSchema.optional(),
  ...citationFields,
  category:   categorySchema,
  tags:       z.string().optional(),     // comma-separated in the form
});

/** PATCH /api/admin/vault/documents/[id] */
export const PatchDocumentSchema = z.object({
  title:      titleSchema.optional(),
  ...citationFields,
  category:   nonEmpty.max(100).optional(),
  tags:       tagsSchema.optional(),
}).strict();

/** Hard limits applied at the route layer. */
export const UPLOAD_LIMITS = {
  // 100 MB — covers the biggest research PDFs (World Happiness Report,
  // OECD reports, long UN/AIHW dossiers). Bucket-level limit in the
  // migration matches this exactly.
  MAX_FILE_BYTES:      100 * 1024 * 1024,
  MAX_FILES_PER_REQ:   10,
  ALLOWED_MIME: new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
  ]),
} as const;

export const MIME_TO_KIND: Record<string, 'pdf' | 'docx' | 'txt'> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain':     'txt',
  'text/markdown':  'txt',
};

/* ─── Signed-URL upload flow ─────────────────────────────────────────────
 *
 * Large files (>4 MB) can't be sent through Vercel's serverless functions
 * because Vercel imposes a ~4.5 MB request-body limit. Instead, the
 * browser asks the API for a signed upload URL, uploads directly to
 * Supabase Storage (no Vercel hop), then tells the API to start indexing.
 * This keeps arbitrary file sizes in play without any infra changes. */

/** POST /api/admin/vault/documents/upload-url request body. */
export const SignedUploadRequestSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  mime:     z.string().trim().min(1).max(200),
  size:     z.number().int().positive().max(UPLOAD_LIMITS.MAX_FILE_BYTES),
  // sha-256 of the file bytes, computed in the browser (this flow uploads
  // direct to Storage, so the server never sees the bytes). Used for duplicate
  // detection — parity with the paste/url create paths. Optional so older
  // clients still work; dedup is simply skipped when absent.
  hash:     z.string().trim().regex(/^[a-f0-9]{64}$/, 'hash must be a hex sha-256').optional(),
  title:    titleSchema.optional(),
  category: categorySchema,
  tags:     tagsSchema,
});
export type SignedUploadRequest = z.infer<typeof SignedUploadRequestSchema>;
