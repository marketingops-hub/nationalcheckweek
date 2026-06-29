/* ═══════════════════════════════════════════════════════════════════════════
 * Vault RAG — shared types.
 *
 * Single source of truth for the `vault_documents` + `vault_chunks` shape.
 * Mirrors the DB migration 20260420000002_vault_rag.sql. Keep in sync.
 * ═══════════════════════════════════════════════════════════════════════════ */

export type DocumentKind = 'pdf' | 'docx' | 'txt' | 'url' | 'paste';

export type DocumentStatus =
  | 'pending'
  | 'extracting'
  | 'chunking'
  | 'embedding'
  | 'ready'
  | 'failed';

export interface VaultDocument {
  id:           string;
  title:        string;
  kind:         DocumentKind;
  source:       string | null;
  /** Manual reference override; preferred over the composed reference. */
  reference:    string | null;
  /** Structured citation parts. */
  author:       string | null;
  publisher:    string | null;
  year:         string | null;
  /** Canonical public URL the citation links to. */
  source_url:   string | null;
  /** Optional page / locator shown in citations, e.g. "p. 14". */
  page_ref:     string | null;
  storage_path: string | null;
  category:     string;
  tags:         string[];
  status:       DocumentStatus;
  status_error: string | null;
  char_count:   number | null;
  chunk_count:  number;
  token_count:  number | null;
  /** PDF page count (null for non-paged sources / pre-page-tracking rows). */
  page_count:   number | null;
  /** Source size in bytes (files). */
  byte_size:    number | null;
  /** sha-256 of the source — used for duplicate detection. */
  file_hash:    string | null;
  /** How many generations have cited this source, + when last cited. */
  use_count:    number;
  last_used_at: string | null;
  added_by:     string | null;
  created_at:   string;
  updated_at:   string;
}

export interface VaultChunk {
  id:          string;
  document_id: string;
  chunk_index: number;
  content:     string;
  token_count: number;
  /** 1-based source page (PDFs); null otherwise / until re-indexed. */
  page:        number | null;
  /** Nearest preceding heading/section, when detected. */
  heading:     string | null;
  embedding_model: string | null;
  embedding_dims:  number | null;
  created_at:  string;
}

/** Shape returned by the `match_vault_chunks` RPC. */
export interface VaultSearchHit {
  chunk_id:         string;
  document_id:      string;
  document_title:   string;
  document_source:  string | null;
  document_kind:    DocumentKind;
  chunk_page:       number | null;
  chunk_heading:    string | null;
  content:          string;
  similarity:       number;
}

/** Document + chunk previews, used by the detail page. */
export interface VaultDocumentDetail extends VaultDocument {
  chunks: Pick<VaultChunk, 'id' | 'chunk_index' | 'content' | 'token_count'>[];
}

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  pdf:   'PDF',
  docx:  'Word doc',
  txt:   'Text file',
  url:   'Web page',
  paste: 'Pasted text',
};

export const DOCUMENT_KIND_ICONS: Record<DocumentKind, string> = {
  pdf:   'picture_as_pdf',
  docx:  'description',
  txt:   'text_snippet',
  url:   'link',
  paste: 'edit_note',
};

export const STATUS_IS_TERMINAL: Record<DocumentStatus, boolean> = {
  pending:    false,
  extracting: false,
  chunking:   false,
  embedding:  false,
  ready:      true,
  failed:     true,
};

/**
 * A non-terminal document whose `updated_at` is older than this is almost
 * certainly stuck. The indexer runs the whole extract→chunk→embed→store
 * pipeline in a single edge-function invocation; if that invocation is
 * hard-killed (wall-clock/OOM) part way through, the row is stranded in
 * 'chunking'/'embedding'/'extracting' with no error and nothing to retry it.
 * The edge fn's ceiling is ~150s, so 4 min leaves comfortable headroom over
 * a slow-but-still-alive run before we offer a recovery (Re-index) action.
 */
export const STUCK_AFTER_MS = 4 * 60 * 1000;

/** True when a doc is non-terminal but hasn't advanced in STUCK_AFTER_MS. */
export function isDocStuck(doc: { status: DocumentStatus; updated_at: string }): boolean {
  if (STATUS_IS_TERMINAL[doc.status]) return false;
  return Date.now() - new Date(doc.updated_at).getTime() > STUCK_AFTER_MS;
}
