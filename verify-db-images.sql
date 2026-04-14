-- Verify what image URLs are currently in the database

-- Check hero block background
SELECT 
  block_type,
  content->>'backgroundImage' as background_image
FROM homepage_blocks
WHERE block_type = 'hero';

-- Check logo in home_hero_settings
SELECT 
  id,
  logo_url,
  logo_height
FROM home_hero_settings
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Check if home_hero_settings table exists and has any rows
SELECT COUNT(*) as row_count FROM home_hero_settings;
