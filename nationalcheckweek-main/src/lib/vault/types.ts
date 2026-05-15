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
  storage_path: string | null;
  category:     string;
  tags:         string[];
  status:       DocumentStatus;
  status_error: string | null;
  char_count:   number | null;
  chunk_count:  number;
  token_count:  number | null;
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
  created_at:  string;
}

/** Shape returned by the `match_vault_chunks` RPC. */
export interface VaultSearchHit {
  chunk_id:         string;
  document_id:      string;
  document_title:   string;
  document_source:  string | null;
  document_kind:    DocumentKind;
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
