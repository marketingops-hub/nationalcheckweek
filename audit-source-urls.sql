-- Source URL Quality Audit
-- Analyzes all sources in vault_sources to identify URL quality issues

-- 1. Get all sources with URL quality classification
SELECT 
  id,
  title,
  url,
  domain,
  category,
  is_approved,
  added_by,
  created_at,
  CASE 
    WHEN url IS NULL OR url = '' THEN 'missing'
    WHEN url = 'https://' || domain THEN 'homepage_only'
    WHEN url = 'https://' || domain || '/' THEN 'homepage_only'
    WHEN url LIKE '%nationalcheckinweek.com/states/%' AND url NOT LIKE '%#%' AND url NOT LIKE '%?%' THEN 'generic_section'
    WHEN url LIKE '%nationalcheckinweek.com/areas/%' AND url NOT LIKE '%#%' AND url NOT LIKE '%?%' THEN 'generic_section'
    WHEN LENGTH(url) - LENGTH(REPLACE(url, '/', '')) <= 3 THEN 'too_generic'
    ELSE 'specific'
  END as url_quality,
  LENGTH(url) as url_length,
  (LENGTH(url) - LENGTH(REPLACE(url, '/', ''))) as path_depth
FROM vault_sources
ORDER BY 
  CASE 
    WHEN url IS NULL OR url = '' THEN 1
    WHEN url = 'https://' || domain THEN 2
    WHEN url = 'https://' || domain || '/' THEN 2
    ELSE 3
  END,
  domain,
  title;

-- 2. Summary statistics
SELECT 
  CASE 
    WHEN url IS NULL OR url = '' THEN 'missing'
    WHEN url = 'https://' || domain THEN 'homepage_only'
    WHEN url = 'https://' || domain || '/' THEN 'homepage_only'
    WHEN url LIKE '%nationalcheckinweek.com/states/%' AND url NOT LIKE '%#%' AND url NOT LIKE '%?%' THEN 'generic_section'
    WHEN url LIKE '%nationalcheckinweek.com/areas/%' AND url NOT LIKE '%#%' AND url NOT LIKE '%?%' THEN 'generic_section'
    WHEN LENGTH(url) - LENGTH(REPLACE(url, '/', '')) <= 3 THEN 'too_generic'
    ELSE 'specific'
  END as url_quality,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM vault_sources), 2) as percentage
FROM vault_sources
GROUP BY url_quality
ORDER BY count DESC;

-- 3. Sources by category and quality
SELECT 
  category,
  CASE 
    WHEN url IS NULL OR url = '' THEN 'missing'
    WHEN url = 'https://' || domain THEN 'homepage_only'
    WHEN url = 'https://' || domain || '/' THEN 'homepage_only'
    WHEN LENGTH(url) - LENGTH(REPLACE(url, '/', '')) <= 3 THEN 'too_generic'
    ELSE 'specific'
  END as url_quality,
  COUNT(*) as count
FROM vault_sources
GROUP BY category, url_quality
ORDER BY category, count DESC;

-- 4. Get sources linked to entities (these are high priority)
SELECT 
  vs.id,
  vs.title,
  vs.url,
  vs.domain,
  vs.category,
  COUNT(DISTINCT sl.id) as link_count,
  STRING_AGG(DISTINCT sl.entity_type, ', ') as linked_entity_types,
  CASE 
    WHEN vs.url IS NULL OR vs.url = '' THEN 'missing'
    WHEN vs.url = 'https://' || vs.domain THEN 'homepage_only'
    WHEN vs.url = 'https://' || vs.domain || '/' THEN 'homepage_only'
    WHEN LENGTH(vs.url) - LENGTH(REPLACE(vs.url, '/', '')) <= 3 THEN 'too_generic'
    ELSE 'specific'
  END as url_quality
FROM vault_sources vs
LEFT JOIN source_links sl ON vs.id = sl.source_id
GROUP BY vs.id, vs.title, vs.url, vs.domain, vs.category
HAVING COUNT(DISTINCT sl.id) > 0
ORDER BY link_count DESC, url_quality;

-- 5. Problematic sources that need immediate attention
SELECT 
  vs.id,
  vs.title,
  vs.url,
  vs.domain,
  vs.category,
  COUNT(DISTINCT sl.id) as entities_linked,
  STRING_AGG(DISTINCT sl.entity_type || ':' || sl.entity_slug, ', ') as linked_to
FROM vault_sources vs
LEFT JOIN source_links sl ON vs.id = sl.source_id
WHERE 
  vs.url IS NULL 
  OR vs.url = '' 
  OR vs.url = 'https://' || vs.domain 
  OR vs.url = 'https://' || vs.domain || '/'
  OR (LENGTH(vs.url) - LENGTH(REPLACE(vs.url, '/', ''))) <= 3
GROUP BY vs.id, vs.title, vs.url, vs.domain, vs.category
ORDER BY entities_linked DESC, vs.category;
