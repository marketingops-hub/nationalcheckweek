-- Performance optimization: Add indexes for frequently queried fields
-- Phase 1: Quick wins - Database optimization

-- Index for homepage blocks ordering (most common query)
CREATE INDEX IF NOT EXISTS idx_homepage_blocks_visible_order 
ON homepage_blocks(is_visible, display_order)
WHERE is_visible = true;

-- Index for menu items ordering
CREATE INDEX IF NOT EXISTS idx_menu_items_active_position 
ON menu_items(is_active, position)
WHERE is_active = true AND parent_id IS NULL;

-- Index for menu items parent-child relationships
CREATE INDEX IF NOT EXISTS idx_menu_items_parent 
ON menu_items(parent_id)
WHERE parent_id IS NOT NULL;

-- Index for pages by slug (common lookup)
CREATE INDEX IF NOT EXISTS idx_pages_slug 
ON pages(slug)
WHERE is_published = true;

-- JSONB index for homepage block colors (if querying by colors)
CREATE INDEX IF NOT EXISTS idx_homepage_blocks_colors 
ON homepage_blocks USING gin ((content->'colors'))
WHERE is_visible = true;

-- Verify indexes created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
