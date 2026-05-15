-- ═══════════════════════════════════════════════════════════════════════════
-- Add GEO-page metadata to the `pages` table (the block-editor CMS used
-- by /admin/cms/pages — not the legacy `cms_pages` table).
--
-- New columns:
--   • category          'standard' | 'geo'. Drives the sub-category tabs on
--                       /admin/cms/pages. Backfilled to 'standard' for
--                       every existing row.
--   • area_slug         Set on GEO rows; points at areas.slug (TEXT, not
--                       an FK — a deleted area shouldn't cascade-delete
--                       published page content).
--   • issue_slug        Set on GEO rows; points at issues.slug. Same
--                       FK-free rationale.
--   • source_draft_id   Back-reference to content_drafts for idempotent
--                       re-publish (same pattern as blog_posts).
--
-- Constraints:
--   • Partial UNIQUE (source_draft_id) — at most one page per draft.
--   • Partial UNIQUE (area_slug, issue_slug) WHERE category='geo' — at
--     most one GEO page per (town, issue) pair.
--
-- Every statement is guarded with IF NOT EXISTS so the migration is safe
-- to re-run against an already-upgraded database.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'standard';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pages_category_check'
      AND conrelid = 'public.pages'::regclass
  ) THEN
    ALTER TABLE public.pages
      ADD CONSTRAINT pages_category_check
      CHECK (category IN ('standard','geo'));
  END IF;
END $$;

ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS area_slug TEXT,
  ADD COLUMN IF NOT EXISTS issue_slug TEXT,
  ADD COLUMN IF NOT EXISTS source_draft_id UUID
    REFERENCES content_drafts(id) ON DELETE SET NULL;

-- One page per originating draft. NULL source_draft_id rows are exempt
-- (standard pages created directly via /admin/cms/pages/new).
CREATE UNIQUE INDEX IF NOT EXISTS pages_source_draft_id_uniq
  ON public.pages (source_draft_id)
  WHERE source_draft_id IS NOT NULL;

-- One GEO page per (area_slug, issue_slug) pair.
CREATE UNIQUE INDEX IF NOT EXISTS pages_geo_area_issue_uniq
  ON public.pages (area_slug, issue_slug)
  WHERE category = 'geo'
    AND area_slug IS NOT NULL
    AND issue_slug IS NOT NULL;

-- Fast lookups for the /admin/cms/pages tab filter.
CREATE INDEX IF NOT EXISTS pages_category_idx
  ON public.pages (category);
