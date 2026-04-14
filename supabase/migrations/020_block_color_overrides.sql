-- Add support for per-block color overrides
-- Blocks can now choose to use global colors or define custom colors

-- Update table comment to document new color override feature
COMMENT ON TABLE homepage_blocks IS 'Homepage content blocks with support for global or custom colors. Each block can set "useGlobalColors": true/false in content.colors object. When false, block uses content.colors.{colorName} values instead of global settings.';

-- Example block content structure with color overrides:
-- {
--   "heading": "My Block",
--   "colors": {
--     "useGlobalColors": false,
--     "primaryButton": "#FF5733",
--     "accentColor": "#C70039",
--     "backgroundColor": "#FFF"
--   },
--   ... other content
-- }

-- No schema changes needed - JSONB already supports this structure
-- This migration documents the feature and provides examples

-- Example: Update a specific block to use custom colors
-- UPDATE homepage_blocks 
-- SET content = jsonb_set(
--   content,
--   '{colors}',
--   '{"useGlobalColors": false, "primaryButton": "#FF5733", "accentColor": "#C70039"}'::jsonb
-- )
-- WHERE block_type = 'hero';
