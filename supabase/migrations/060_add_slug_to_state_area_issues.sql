-- Migration: Add `slug` field to state issues and area issues JSONB
-- so issue cards can link directly to /issues/[slug] pages.
-- Uses keyword matching to map existing issue names to global issue slugs.
-- Safe to re-run: only sets slug where it is not already present.

-- ── Helper function: map an issue name to a global slug ──────────────────────
CREATE OR REPLACE FUNCTION map_issue_slug(issue_name text) RETURNS text AS $$
BEGIN
  -- Match most specific patterns first
  IF issue_name ILIKE '%cyberbullying%'                          THEN RETURN 'cyberbullying'; END IF;
  IF issue_name ILIKE '%self-harm%'  OR issue_name ILIKE '%suicid%' THEN RETURN 'self-harm-suicidality'; END IF;
  IF issue_name ILIKE '%racism%'
     OR issue_name ILIKE '%discriminat%'
     OR issue_name ILIKE '%exclusion%'
     OR issue_name ILIKE '%racial%'                              THEN RETURN 'racism-discrimination'; END IF;
  IF issue_name ILIKE '%anxiety%'    OR issue_name ILIKE '%depression%' THEN RETURN 'anxiety-depression'; END IF;
  IF issue_name ILIKE '%bullying%'                               THEN RETURN 'bullying'; END IF;
  IF issue_name ILIKE '%loneliness%' OR issue_name ILIKE '%distress%'   THEN RETURN 'distress-loneliness'; END IF;
  IF issue_name ILIKE '%belonging%'  OR issue_name ILIKE '%connectedness%' THEN RETURN 'school-belonging'; END IF;
  IF issue_name ILIKE '%refusal%'                                THEN RETURN 'school-refusal'; END IF;
  IF issue_name ILIKE '%attendance%'
     OR issue_name ILIKE '%absentee%'
     OR issue_name ILIKE '%truanc%'
     OR issue_name ILIKE '%remote%'   AND issue_name ILIKE '%attend%'   THEN RETURN 'attendance-disengagement'; END IF;
  IF issue_name ILIKE '%sleep%'      OR issue_name ILIKE '%fatigue%'    THEN RETURN 'sleep-deprivation'; END IF;
  IF issue_name ILIKE '%online hate%'
     OR issue_name ILIKE '%online harm%'
     OR issue_name ILIKE '%online harass%'                       THEN RETURN 'online-hate'; END IF;
  IF issue_name ILIKE '%motivation%'
     OR issue_name ILIKE '%disengagement%'
     OR issue_name ILIKE '%disengage%'                           THEN RETURN 'motivation-disengagement'; END IF;
  IF issue_name ILIKE '%reporting%'  OR issue_name ILIKE '%incident%'   THEN RETURN 'reporting-gaps'; END IF;
  -- Remote attendance is a WA-specific framing of attendance-disengagement
  IF issue_name ILIKE '%remote%' AND (issue_name ILIKE '%school%' OR issue_name ILIKE '%crisis%') THEN RETURN 'attendance-disengagement'; END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── Update states.issues (field name: "name") ────────────────────────────────
UPDATE states
SET issues = (
  SELECT jsonb_agg(
    CASE
      WHEN (issue->>'slug') IS NOT NULL AND (issue->>'slug') <> '' THEN issue
      WHEN map_issue_slug(issue->>'name') IS NOT NULL
        THEN issue || jsonb_build_object('slug', map_issue_slug(issue->>'name'))
      ELSE issue
    END
  )
  FROM jsonb_array_elements(issues) AS issue
)
WHERE issues IS NOT NULL
  AND jsonb_array_length(issues) > 0;

-- ── Update areas.issues (field name: "title") ────────────────────────────────
UPDATE areas
SET issues = (
  SELECT jsonb_agg(
    CASE
      WHEN (issue->>'slug') IS NOT NULL AND (issue->>'slug') <> '' THEN issue
      WHEN map_issue_slug(issue->>'title') IS NOT NULL
        THEN issue || jsonb_build_object('slug', map_issue_slug(issue->>'title'))
      ELSE issue
    END
  )
  FROM jsonb_array_elements(issues) AS issue
)
WHERE issues IS NOT NULL
  AND jsonb_array_length(issues) > 0;

-- ── Verify ───────────────────────────────────────────────────────────────────
DO $$
DECLARE
  state_linked   integer;
  state_total    integer;
  area_linked    integer;
  area_total     integer;
BEGIN
  SELECT
    count(*) FILTER (WHERE issue->>'slug' IS NOT NULL),
    count(*)
  INTO state_linked, state_total
  FROM states, jsonb_array_elements(issues) AS issue
  WHERE issues IS NOT NULL;

  SELECT
    count(*) FILTER (WHERE issue->>'slug' IS NOT NULL),
    count(*)
  INTO area_linked, area_total
  FROM areas, jsonb_array_elements(issues) AS issue
  WHERE issues IS NOT NULL;

  RAISE NOTICE 'States issues: %/% linked to global issue pages', state_linked, state_total;
  RAISE NOTICE 'Areas  issues: %/% linked to global issue pages', area_linked,  area_total;
END $$;

DROP FUNCTION IF EXISTS map_issue_slug(text);
