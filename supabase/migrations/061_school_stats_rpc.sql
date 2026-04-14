-- Migration: Server-side school stats aggregation RPCs
-- Replaces row-fetching approach which was capped at PostgREST max-rows (1000).
-- Both functions run entirely in Postgres and return a single JSON object.

-- ── State-level aggregation ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_school_stats_for_state(p_state_code text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total_schools',      COUNT(*),
    'total_enrolments',   COALESCE(SUM(total_enrolments), 0),
    'avg_icsea',          CASE WHEN COUNT(icsea) > 0
                               THEN ROUND(AVG(icsea)::numeric)
                               ELSE NULL END,
    'sector_counts',      (
      SELECT jsonb_object_agg(school_sector, cnt)
      FROM (
        SELECT COALESCE(school_sector, 'Unknown') AS school_sector, COUNT(*) AS cnt
        FROM school_profiles
        WHERE state = p_state_code
        GROUP BY school_sector
      ) s
    ),
    'geo_counts',         (
      SELECT jsonb_object_agg(geolocation, cnt)
      FROM (
        SELECT COALESCE(geolocation, 'Unknown') AS geolocation, COUNT(*) AS cnt
        FROM school_profiles
        WHERE state = p_state_code
        GROUP BY geolocation
      ) g
    ),
    'avg_indigenous_pct', CASE WHEN COUNT(indigenous_enrolments_pct) > 0
                               THEN ROUND(AVG(indigenous_enrolments_pct)::numeric, 1)
                               ELSE NULL END,
    'avg_lbote_pct',      CASE WHEN COUNT(lbote_yes_pct) > 0
                               THEN ROUND(AVG(lbote_yes_pct)::numeric, 1)
                               ELSE NULL END,
    'avg_bottom_qtr_pct', CASE WHEN COUNT(bottom_sea_quarter_pct) > 0
                               THEN ROUND(AVG(bottom_sea_quarter_pct)::numeric, 1)
                               ELSE NULL END
  )
  FROM school_profiles
  WHERE state = p_state_code;
$$;

GRANT EXECUTE ON FUNCTION get_school_stats_for_state(text) TO anon, authenticated;

-- ── Area-level aggregation ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_school_stats_for_area(p_area_slug text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total_schools',      COUNT(*),
    'total_enrolments',   COALESCE(SUM(total_enrolments), 0),
    'avg_icsea',          CASE WHEN COUNT(icsea) > 0
                               THEN ROUND(AVG(icsea)::numeric)
                               ELSE NULL END,
    'sector_counts',      (
      SELECT jsonb_object_agg(school_sector, cnt)
      FROM (
        SELECT COALESCE(school_sector, 'Unknown') AS school_sector, COUNT(*) AS cnt
        FROM school_profiles
        WHERE area_slug = p_area_slug
        GROUP BY school_sector
      ) s
    ),
    'avg_indigenous_pct', CASE WHEN COUNT(indigenous_enrolments_pct) > 0
                               THEN ROUND(AVG(indigenous_enrolments_pct)::numeric, 1)
                               ELSE NULL END,
    'avg_lbote_pct',      CASE WHEN COUNT(lbote_yes_pct) > 0
                               THEN ROUND(AVG(lbote_yes_pct)::numeric, 1)
                               ELSE NULL END,
    'avg_bottom_qtr_pct', CASE WHEN COUNT(bottom_sea_quarter_pct) > 0
                               THEN ROUND(AVG(bottom_sea_quarter_pct)::numeric, 1)
                               ELSE NULL END
  )
  FROM school_profiles
  WHERE area_slug = p_area_slug;
$$;

GRANT EXECUTE ON FUNCTION get_school_stats_for_area(text) TO anon, authenticated;
