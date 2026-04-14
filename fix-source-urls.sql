-- Fix Source URLs - Migration Script
-- Date: April 3, 2026
-- Purpose: Update generic source URLs to point to specific pages where data was sourced

-- IMPORTANT: Before running this script, determine:
-- 1. Are these self-referential sources (NCIW's own research)?
-- 2. Or should they cite external sources (AIHW, ABS, etc.)?
-- 3. What specific pages contain the actual data?

-- ============================================================================
-- BACKUP CURRENT DATA (Run this first!)
-- ============================================================================

-- Create backup table
CREATE TABLE IF NOT EXISTS vault_sources_backup_20260403 AS 
SELECT * FROM vault_sources;

-- Verify backup
SELECT COUNT(*) as backed_up_sources FROM vault_sources_backup_20260403;

-- ============================================================================
-- OPTION A: If these are NCIW's own research/data
-- ============================================================================

-- Update Victoria source to point to specific research page
-- UNCOMMENT AND MODIFY AFTER DETERMINING CORRECT URL:
/*
UPDATE vault_sources
SET 
  url = 'https://nationalcheckinweek.com/research/2024-victoria-report#key-findings',
  description = 'Original research findings from National Check-In Week 2024 Victoria survey - key statistics on youth mental health participation and outcomes',
  updated_at = now()
WHERE url = 'https://nationalcheckinweek.com/states/victoria';
*/

-- Update Melbourne source to point to specific data page
-- UNCOMMENT AND MODIFY AFTER DETERMINING CORRECT URL:
/*
UPDATE vault_sources
SET 
  url = 'https://nationalcheckinweek.com/data/melbourne-2024#participation-statistics',
  description = 'Melbourne-specific participation statistics and youth mental health data from National Check-In Week 2024',
  updated_at = now()
WHERE url = 'https://nationalcheckinweek.com/areas/melbourne';
*/

-- ============================================================================
-- OPTION B: If these should cite external sources
-- ============================================================================

-- Example: Replace with AIHW source
-- UNCOMMENT AND MODIFY AFTER DETERMINING CORRECT EXTERNAL SOURCE:
/*
-- Delete self-referential Victoria source
DELETE FROM source_links 
WHERE source_id = (SELECT id FROM vault_sources WHERE url = 'https://nationalcheckinweek.com/states/victoria');

DELETE FROM vault_sources 
WHERE url = 'https://nationalcheckinweek.com/states/victoria';

-- Add external AIHW source
INSERT INTO vault_sources (url, title, description, category, is_approved, added_by)
VALUES (
  'https://www.aihw.gov.au/reports/mental-health/youth-mental-health-2024/victoria#statistics',
  'AIHW Youth Mental Health Report 2024 - Victoria',
  'Victorian youth mental health statistics from Australian Institute of Health and Welfare 2024 report',
  'research',
  true,
  'admin'
)
ON CONFLICT (url) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = now();

-- Re-link to Victoria state
INSERT INTO source_links (source_id, entity_type, entity_slug, relevance, notes)
SELECT 
  id,
  'state',
  'victoria',
  'primary',
  'Primary external source for Victoria youth mental health data from AIHW'
FROM vault_sources 
WHERE url = 'https://www.aihw.gov.au/reports/mental-health/youth-mental-health-2024/victoria#statistics'
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- OPTION C: Add both internal and external sources
-- ============================================================================

-- Keep NCIW page as secondary source, add external as primary
-- UNCOMMENT AND MODIFY AFTER DETERMINING CORRECT URLS:
/*
-- Update NCIW source to be more specific and mark as secondary
UPDATE vault_sources
SET 
  url = 'https://nationalcheckinweek.com/states/victoria#data-summary',
  description = 'National Check-In Week Victoria page - summary of aggregated youth mental health data',
  updated_at = now()
WHERE url = 'https://nationalcheckinweek.com/states/victoria';

-- Change existing link to secondary
UPDATE source_links
SET 
  relevance = 'secondary',
  notes = 'NCIW aggregated data summary for Victoria'
WHERE source_id = (SELECT id FROM vault_sources WHERE url LIKE '%nationalcheckinweek.com/states/victoria%')
  AND entity_type = 'state'
  AND entity_slug = 'victoria';

-- Add external primary source
INSERT INTO vault_sources (url, title, description, category, is_approved, added_by)
VALUES (
  'https://www.aihw.gov.au/reports/mental-health/youth-mental-health-2024/victoria#statistics',
  'AIHW Youth Mental Health Report 2024 - Victoria',
  'Original Victorian youth mental health statistics from Australian Institute of Health and Welfare',
  'research',
  true,
  'admin'
)
ON CONFLICT (url) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = now();

-- Link external source as primary
INSERT INTO source_links (source_id, entity_type, entity_slug, relevance, notes)
SELECT 
  id,
  'state',
  'victoria',
  'primary',
  'Primary external source - original research data from AIHW'
FROM vault_sources 
WHERE url = 'https://www.aihw.gov.au/reports/mental-health/youth-mental-health-2024/victoria#statistics'
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check updated sources
SELECT 
  id,
  title,
  url,
  domain,
  category,
  description,
  updated_at
FROM vault_sources
ORDER BY updated_at DESC;

-- Check source links
SELECT 
  sl.entity_type,
  sl.entity_slug,
  sl.relevance,
  vs.title,
  vs.url,
  vs.category
FROM source_links sl
JOIN vault_sources vs ON sl.source_id = vs.id
ORDER BY sl.entity_type, sl.entity_slug, sl.relevance;

-- Check URL quality after fixes
SELECT 
  CASE 
    WHEN url IS NULL OR url = '' THEN 'missing'
    WHEN url = 'https://' || domain THEN 'homepage_only'
    WHEN url = 'https://' || domain || '/' THEN 'homepage_only'
    WHEN LENGTH(url) - LENGTH(REPLACE(url, '/', '')) <= 3 THEN 'too_generic'
    ELSE 'specific'
  END as url_quality,
  COUNT(*) as count
FROM vault_sources
GROUP BY url_quality;

-- ============================================================================
-- ROLLBACK (If needed)
-- ============================================================================

-- To rollback changes:
/*
-- Delete new sources
DELETE FROM vault_sources 
WHERE created_at > (SELECT MAX(created_at) FROM vault_sources_backup_20260403);

-- Restore from backup
UPDATE vault_sources vs
SET 
  url = b.url,
  title = b.title,
  description = b.description,
  updated_at = b.updated_at
FROM vault_sources_backup_20260403 b
WHERE vs.id = b.id;

-- Verify rollback
SELECT COUNT(*) FROM vault_sources;
*/

-- ============================================================================
-- NOTES FOR FUTURE SOURCE ADDITIONS
-- ============================================================================

-- Good URL Examples:
-- ✅ https://www.aihw.gov.au/reports/mental-health/youth-2024/contents/summary
-- ✅ https://www.abs.gov.au/statistics/health/mental-health/national-health-survey/2023#data-downloads
-- ✅ https://www.sciencedirect.com/science/article/pii/S0165032724001234
-- ✅ https://headspace.org.au/research/youth-mental-health-report-2024#key-findings

-- Bad URL Examples:
-- ❌ https://www.aihw.gov.au/ (homepage only)
-- ❌ https://www.abs.gov.au/statistics (too generic)
-- ❌ https://nationalcheckinweek.com/states/victoria (generic section)
-- ❌ https://headspace.org.au/research (no specific report)
