-- ═════════════════════════════════════════════════════════════════════════════
-- Vault RAG rebuild.
--
-- Turns the Vault from two disconnected tables (bookmark-only `vault_sources`
-- + paste-only `vault_content`) into a proper RAG library:
--
--   vault_documents   one row per uploaded / pasted / crawled item
--   vault_chunks      token-sized slices of a document, each with an embedding
--
-- Retrieval moves from substring-match to cosine-similarity over pgvector.
--
-- Safety rollout:
--   • `vault_content` is KEPT during this migration so the existing keyword
--     retriever in Content Creator keeps working until the new path is proven.
--     A follow-up migration will drop it once cut-over is confirmed.
--   • Existing `vault_content` rows are copied into `vault_documents` with
--     kind='paste' and status='pending' so the indexer will re-embed them on
--     first run.
--   • `vault_sources` is dropped \u2014 it never contributed to AI output.
-- ═════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS vector;

-- ─── vault_documents ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vault_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  title         TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 500),

  -- Origin of the document. Drives which extractor runs in the indexer.
  kind          TEXT NOT NULL
                CHECK (kind IN ('pdf','docx','txt','url','paste')),

  -- Human-facing source reference:
  --   • pdf / docx / txt → original filename
  --   • url              → the crawled URL
  --   • paste            → optional citation the admin typed
  source        TEXT,

  -- Key in the Supabase Storage `vault` bucket. NULL for kind='paste' / 'url'.
  storage_path  TEXT,

  category      TEXT NOT NULL DEFAULT 'general'
                CHECK (char_length(category) BETWEEN 1 AND 100),
  tags          TEXT[] NOT NULL DEFAULT '{}',

  -- Indexing pipeline state machine.
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN (
                  'pending',     -- row inserted, indexer not yet invoked
                  'extracting',  -- pulling text out of the source
                  'chunking',    -- splitting extracted text into chunks
                  'embedding',   -- calling OpenAI for chunk embeddings
                  'ready',       -- chunks + embeddings persisted; AI-usable
                  'failed'       -- something exploded; status_error explains
                )),
  status_error  TEXT,

  char_count    INT,
  chunk_count   INT NOT NULL DEFAULT 0,
  token_count   INT,

  added_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE vault_documents IS
  'One row per ingested item (PDF, DOCX, TXT, URL crawl, or pasted text). The indexer edge function consumes status=pending rows and produces vault_chunks.';

CREATE INDEX IF NOT EXISTS vault_documents_status_idx   ON vault_documents(status);
CREATE INDEX IF NOT EXISTS vault_documents_category_idx ON vault_documents(category);
CREATE INDEX IF NOT EXISTS vault_documents_kind_idx     ON vault_documents(kind);
CREATE INDEX IF NOT EXISTS vault_documents_tags_idx     ON vault_documents USING gin(tags);

DROP TRIGGER IF EXISTS vault_documents_updated_at ON vault_documents;
CREATE TRIGGER vault_documents_updated_at
  BEFORE UPDATE ON vault_documents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── vault_chunks ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vault_chunks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID NOT NULL REFERENCES vault_documents(id) ON DELETE CASCADE,

  -- Position within the document (0-based, contiguous).
  chunk_index  INT  NOT NULL CHECK (chunk_index >= 0),

  content      TEXT NOT NULL CHECK (char_length(content) > 0),
  token_count  INT  NOT NULL CHECK (token_count > 0),

  -- text-embedding-3-small → 1536 dimensions. If we upgrade the model we add
  -- a new column (e.g. embedding_v2) and re-embed in-place rather than casting.
  embedding    vector(1536),

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (document_id, chunk_index)
);

COMMENT ON TABLE vault_chunks IS
  'Token-aware slices of a vault_document with OpenAI embeddings. Similarity search via match_vault_chunks().';

CREATE INDEX IF NOT EXISTS vault_chunks_document_idx ON vault_chunks(document_id);

-- HNSW is the right default for <100k vectors on a single node. Switch to
-- IVFFlat with a trained index once we cross ~1M rows.
CREATE INDEX IF NOT EXISTS vault_chunks_embedding_idx
  ON vault_chunks USING hnsw (embedding vector_cosine_ops);

-- ─── RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE vault_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_chunks    ENABLE ROW LEVEL SECURITY;

-- The admin UI + edge functions all talk through the service-role key which
-- bypasses RLS. No anon access; no authenticated access beyond read-only for
-- future client-side search (leaving off for now — add a SELECT policy when
-- we actually need it).

DROP POLICY IF EXISTS "service_role_all" ON vault_documents;
CREATE POLICY "service_role_all" ON vault_documents
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all" ON vault_chunks;
CREATE POLICY "service_role_all" ON vault_chunks
  FOR ALL USING (auth.role() = 'service_role');

-- ─── Similarity-search RPC ────────────────────────────────────────────────
--
-- Returns the top-k most similar chunks to a query embedding, filtered by
-- document status + optional category. Similarity is `1 - cosine_distance`
-- so 1.0 = identical, 0.0 = orthogonal. The `<=>` operator is cosine distance.

CREATE OR REPLACE FUNCTION match_vault_chunks(
  query_embedding  vector(1536),
  match_k          INT   DEFAULT 12,
  min_similarity   FLOAT DEFAULT 0.25,
  category_filter  TEXT  DEFAULT NULL
)
RETURNS TABLE (
  chunk_id         UUID,
  document_id      UUID,
  document_title   TEXT,
  document_source  TEXT,
  document_kind    TEXT,
  content          TEXT,
  similarity       FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.id        AS chunk_id,
    c.document_id,
    d.title     AS document_title,
    d.source    AS document_source,
    d.kind      AS document_kind,
    c.content,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM vault_chunks c
  JOIN vault_documents d ON d.id = c.document_id
  WHERE d.status = 'ready'
    AND c.embedding IS NOT NULL
    AND (category_filter IS NULL OR d.category = category_filter)
    AND 1 - (c.embedding <=> query_embedding) >= min_similarity
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_k;
$$;

COMMENT ON FUNCTION match_vault_chunks IS
  'Cosine-similarity search over vault_chunks. Used by the content-creator edge function for RAG retrieval.';

-- ─── Migrate existing vault_content rows ──────────────────────────────────
--
-- Every manually-pasted block becomes a pending `paste` document. The indexer
-- will chunk + embed them when it next runs. We embed the old content into
-- the title / source columns and put the actual text in a transient column
-- that the indexer reads (see below).

-- Transient column: the indexer reads text from here on the first run for
-- migrated paste rows, then clears it. For new paste uploads the API writes
-- directly and the indexer reads the same column.
ALTER TABLE vault_documents
  ADD COLUMN IF NOT EXISTS raw_text TEXT;

COMMENT ON COLUMN vault_documents.raw_text IS
  'Holding pen for extracted / pasted text between insert and indexing. Cleared once chunks are stored.';

INSERT INTO vault_documents (title, kind, source, category, status, raw_text, created_at, updated_at)
SELECT
  COALESCE(NULLIF(title, ''), 'Pasted content ' || to_char(created_at, 'YYYY-MM-DD')),
  'paste',
  NULLIF(source, ''),
  COALESCE(NULLIF(category, ''), 'general'),
  'pending',
  content,
  COALESCE(created_at, NOW()),
  COALESCE(updated_at, NOW())
FROM vault_content
WHERE is_approved IS NOT FALSE;

-- ─── Storage bucket for uploaded PDFs / DOCX / TXT files ─────────────────
--
-- Private bucket with a 100 MB file-size ceiling (matches UPLOAD_LIMITS in
-- src/lib/vault/schemas.ts). Only the service-role key (used by the Next.js
-- API routes + the vault-indexer edge function) can read/write — there's no
-- need for public or authenticated access.
--
-- 100 MB covers the biggest research PDFs (World Happiness Report, OECD
-- reports, long UN/AIHW dossiers). If you later need bigger, bump both
-- this value and UPLOAD_LIMITS.MAX_FILE_BYTES together.

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('vault', 'vault', FALSE, 104857600)
ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit;

-- ─── Note on vault_sources ────────────────────────────────────────────────
--
-- We deliberately do NOT drop vault_sources in this migration, even though
-- the new AI pipeline ignores it. The `/admin/sources` entity-links feature
-- (`source_links`, `getSourcesForEntity`) still reads it for area / state /
-- issue pages — those pages would break at runtime if the table disappeared.
--
-- Cleanup path:
--   1. Port the entity-links feature to pull from vault_documents.
--   2. Ship a follow-up migration that drops vault_sources + source_links.
--
-- Until then, vault_sources is frozen: no UI creates new rows (the old Vault
-- admin is replaced), but existing rows + their entity links remain queryable.
