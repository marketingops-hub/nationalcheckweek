-- ═══════════════════════════════════════════════════════════════════════════
-- content_writing_styles: add content-type scoping + few-shot examples.
--
-- Two additive columns, both defaulted so existing rows / code paths keep
-- working without a backfill:
--
--   applies_to text[]
--     List of content types a style is valid for. DEFAULT {all} means the
--     style works everywhere, matching the pre-Apr-2026 behaviour. Values:
--       'all' | 'blog' | 'newsletter' | 'social'
--     The UI filters the dropdown by the current content_type; the edge
--     fn's resolveStylePrompt silently drops a style that no longer
--     applies (e.g. admin retargeted a blog draft to social but the
--     style was blog-only), same graceful-degrade pattern as is_active.
--
--   examples jsonb
--     Optional 1–3 short snippets per style. Shape:
--       [{ "title": "optional label", "snippet": "the example text" }, ...]
--     Injected into the system prompt as a STYLE EXAMPLES block right
--     after the WRITING STYLE directive, giving the model a tonal anchor.
--     Empty array (default) → no block emitted. Size-capped at 4000 chars
--     total per row by a CHECK so we don't blow the context budget on a
--     single style.
--
-- Migration is idempotent — safe to run twice.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE content_writing_styles
  ADD COLUMN IF NOT EXISTS applies_to text[] NOT NULL
    DEFAULT ARRAY['all']::text[];

ALTER TABLE content_writing_styles
  ADD COLUMN IF NOT EXISTS examples jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Guard: every entry must be a known content type. 'all' is the wildcard
-- that also means "no filter". Keep the set lowercase; the UI + edge fn
-- both compare lowercased.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'content_writing_styles_applies_to_valid'
  ) THEN
    ALTER TABLE content_writing_styles
      ADD CONSTRAINT content_writing_styles_applies_to_valid
      CHECK (
        applies_to <@ ARRAY['all','blog','newsletter','social']::text[]
        AND array_length(applies_to, 1) >= 1
      );
  END IF;
END$$;

-- Guard: total bytes of the examples JSON can't exceed 4 KB. Prevents a
-- single style from dominating the system prompt token budget.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'content_writing_styles_examples_size'
  ) THEN
    ALTER TABLE content_writing_styles
      ADD CONSTRAINT content_writing_styles_examples_size
      CHECK (length(examples::text) <= 4000);
  END IF;
END$$;

-- Fast filter for the dropdown: "active styles applicable to this content type".
-- GIN on the array column; small table so the index is cheap.
CREATE INDEX IF NOT EXISTS idx_content_writing_styles_applies_to
  ON content_writing_styles USING GIN (applies_to);

-- End of migration.
