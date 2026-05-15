-- ═════════════════════════════════════════════════════════════════════════════
-- Content Topics — pre-stage-0 idea bank, generated from the Vault.
--
-- Flow: Vault docs → Topic Generator → content_topics (draft) → admin
-- approves → topic appears as a shortcut in the brief form → spawning a draft
-- flips the topic to 'used'. One-shot semantics: a topic is retired the
-- moment it produces its first idea set, to keep the backlog moving.
--
-- Companion to content_drafts (see 20260420000001_content_drafts.sql).
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS content_topics (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Short catchy title shown in lists / sidebar.
  title                TEXT NOT NULL
                       CHECK (char_length(title) BETWEEN 1 AND 300),

  -- 2-3 sentence hook / angle. The "so what" for this topic.
  angle                TEXT NOT NULL
                       CHECK (char_length(angle) BETWEEN 1 AND 2000),

  -- Optional: why this angle emerged from the vault. Helps the admin
  -- triage — a weak rationale is a good signal to archive.
  rationale            TEXT,

  -- Pre-populated into the brief form when the admin hits "Use →".
  suggested_keywords   TEXT[] NOT NULL DEFAULT '{}',
  suggested_audience   TEXT,
  suggested_tone       TEXT,

  -- Provenance: which vault_documents inspired the topic. We store IDs not
  -- chunk IDs because chunks get wiped on re-index; documents are stable.
  source_document_ids  UUID[] NOT NULL DEFAULT '{}',

  -- Category the generator was scoped to. NULL = 'all'.
  vault_category       TEXT,

  -- Lifecycle:
  --   draft    → just generated, awaiting admin review
  --   approved → shown in the brief-form sidebar, ready to use
  --   used     → already spawned a draft; hidden from the sidebar (one-shot)
  --   archived → rejected by the admin, retained for audit
  status               TEXT NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft','approved','used','archived')),

  -- Backref filled in when the topic spawns its first draft. Kept for audit
  -- even though one-shot means we don't expect a second draft.
  used_in_draft_id     UUID REFERENCES content_drafts(id) ON DELETE SET NULL,
  used_at              TIMESTAMPTZ,

  -- Provenance for debugging / cost analysis. Same shape as content_drafts.
  ai_metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_by           TEXT NOT NULL DEFAULT 'admin',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Common filters on the admin page.
CREATE INDEX IF NOT EXISTS idx_content_topics_status
  ON content_topics(status);
CREATE INDEX IF NOT EXISTS idx_content_topics_category
  ON content_topics(vault_category);
CREATE INDEX IF NOT EXISTS idx_content_topics_created_at
  ON content_topics(created_at DESC);

-- Keep updated_at fresh without trigger boilerplate being scattered.
CREATE OR REPLACE FUNCTION touch_content_topics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_content_topics_updated_at ON content_topics;
CREATE TRIGGER trg_content_topics_updated_at
BEFORE UPDATE ON content_topics
FOR EACH ROW EXECUTE FUNCTION touch_content_topics_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────
-- Topics are admin-only; service role bypasses RLS anyway. We lock the
-- table down so a misconfigured anon client can't read the backlog.

ALTER TABLE content_topics ENABLE ROW LEVEL SECURITY;

-- Only the service role (used by our API routes + edge function) can touch
-- this table. No public/anon/authenticated policies.
DROP POLICY IF EXISTS content_topics_service_all ON content_topics;
CREATE POLICY content_topics_service_all ON content_topics
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─── Cross-link: content_drafts.source_topic_id (soft) ────────────────────
-- We intentionally do NOT add a new column to content_drafts right now —
-- the edge function stores the topic_id inside content_drafts.brief (JSONB)
-- as brief.source_topic_id. Keeps the drafts schema stable and avoids a
-- second migration just for a single FK. If we ever need strict referential
-- integrity we'll promote it to a real column in a future migration.
