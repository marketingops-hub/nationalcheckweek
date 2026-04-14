-- ═══════════════════════════════════════════════════════════════════
-- DASHBOARD PERFORMANCE OPTIMIZATION
-- Materialized views and indexes for faster dashboard queries
-- ═══════════════════════════════════════════════════════════════════

-- Create materialized view for dashboard stats
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats_mv AS
SELECT 
  (SELECT COUNT(*) FROM issues) as issue_count,
  (SELECT COUNT(*) FROM states) as state_count,
  (SELECT COUNT(*) FROM areas) as area_count,
  (SELECT COUNT(*) FROM events) as event_count,
  (SELECT COUNT(*) FROM events WHERE published = true) as published_event_count,
  (SELECT COUNT(*) FROM areas WHERE seo_title IS NULL OR seo_title = '') as seo_missing_count,
  (SELECT COUNT(*) FROM school_profiles) as school_count,
  NOW() as last_updated;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS dashboard_stats_mv_last_updated_idx 
ON dashboard_stats_mv (last_updated);

-- Function to refresh dashboard stats
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats_mv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add performance indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_issues_updated_at ON issues(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_areas_updated_at ON areas(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_updated_at ON events(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_published ON events(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_areas_seo_missing ON areas(seo_title) WHERE seo_title IS NULL OR seo_title = '';

-- Initial refresh
SELECT refresh_dashboard_stats();

-- Comment
COMMENT ON MATERIALIZED VIEW dashboard_stats_mv IS 'Cached dashboard statistics for performance';
COMMENT ON FUNCTION refresh_dashboard_stats() IS 'Refreshes dashboard stats materialized view';
