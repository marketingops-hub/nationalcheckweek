-- ═══════════════════════════════════════════════════════════════════════════
-- Add `geo` as a fourth content_type on content_drafts.
--
-- GEO drafts pair an area (town) with an issue and produce a 1000+ word
-- location-aware article that ultimately lands on cms_pages with
-- category='geo' (see 20260422000003_cms_pages_geo_category.sql).
--
-- Two existing CHECK constraints must grow to accommodate the new type:
--
--   1. `content_type IN (...)`  — simply add 'geo'.
--   2. `title_rules`            — GEO drafts ALWAYS have a title (title is
--      auto-composed from area + issue at creation time), so it joins the
--      `blog / newsletter` branch that requires a non-empty title.
--
-- Re-creating both constraints in-place rather than with IF NOT EXISTS
-- because Postgres has no "drop-if-different" primitive for CHECKs. Two
-- wrapping DO blocks handle the "already upgraded" case so repeated runs
-- stay idempotent.
-- ═══════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  ALTER TABLE content_drafts DROP CONSTRAINT IF EXISTS content_drafts_content_type_check;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

ALTER TABLE content_drafts
  ADD CONSTRAINT content_drafts_content_type_check
  CHECK (content_type IN ('social', 'blog', 'newsletter', 'geo'));

DO $$ BEGIN
  ALTER TABLE content_drafts DROP CONSTRAINT IF EXISTS title_rules;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

ALTER TABLE content_drafts
  ADD CONSTRAINT title_rules CHECK (
    (content_type = 'social' AND title IS NULL)
    OR
    (content_type IN ('blog','newsletter','geo')
     AND title IS NOT NULL
     AND length(trim(title)) > 0)
  );
