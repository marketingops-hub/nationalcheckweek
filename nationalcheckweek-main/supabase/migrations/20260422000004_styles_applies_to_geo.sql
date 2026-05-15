-- ═══════════════════════════════════════════════════════════════════════════
-- Extend content_writing_styles.applies_to to accept 'geo'.
--
-- The Apr-2026 GEO content type lets admins write location+issue landing
-- pages through the same Writing-Style system. The previous CHECK (from
-- 20260421000002_content_writing_styles_scope_examples.sql) only allowed
-- ['all','blog','newsletter','social'] — insert or update of a style row
-- with 'geo' in applies_to would otherwise fail.
--
-- Drop-and-recreate so re-runs are safe; wrapped in DO blocks to swallow
-- "constraint does not exist" on fresh databases.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  ALTER TABLE content_writing_styles
    DROP CONSTRAINT IF EXISTS content_writing_styles_applies_to_valid;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

ALTER TABLE content_writing_styles
  ADD CONSTRAINT content_writing_styles_applies_to_valid
    CHECK (
      applies_to <@ ARRAY['all','blog','newsletter','social','geo']::text[]
      AND array_length(applies_to, 1) >= 1
    );
