-- Comprehensive fix for all external image URLs in the database
-- Replaces Unsplash, pravatar, and other external URLs with local paths or null

-- 1. Fix hero block background image
UPDATE homepage_blocks
SET content = jsonb_set(
  content,
  '{backgroundImage}',
  '"/background/hero-bg.jpg"'
)
WHERE block_type = 'hero'
AND (content->>'backgroundImage' IS NULL 
     OR content->>'backgroundImage' LIKE '%unsplash%'
     OR content->>'backgroundImage' LIKE '%supabase%'
     OR content->>'backgroundImage' = '/hero-bg.jpg');

-- 2. Remove external avatar URLs from testimonials block (use initials fallback instead)
UPDATE homepage_blocks
SET content = jsonb_set(
  content,
  '{testimonials}',
  (
    SELECT jsonb_agg(
      jsonb_set(item, '{avatar}', 'null'::jsonb)
    )
    FROM jsonb_array_elements(content->'testimonials') AS item
  )
)
WHERE block_type = 'testimonials'
AND content->'testimonials' IS NOT NULL;

-- 3. Ensure home_hero_settings uses local logo
INSERT INTO home_hero_settings (
  id,
  logo_url,
  logo_height,
  primary_cta_text,
  primary_cta_link
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '/logo/nciw_no_background-1024x577.png',
  60,
  'Register Now',
  '/events'
)
ON CONFLICT (id) DO UPDATE
SET logo_url = '/logo/nciw_no_background-1024x577.png';

-- Verification
DO $$
DECLARE
  hero_bg TEXT;
  logo TEXT;
BEGIN
  -- Check hero background
  SELECT content->>'backgroundImage' INTO hero_bg
  FROM homepage_blocks
  WHERE block_type = 'hero'
  LIMIT 1;
  
  IF hero_bg = '/background/hero-bg.jpg' THEN
    RAISE NOTICE 'Hero background image: OK';
  ELSE
    RAISE WARNING 'Hero background image may be incorrect: %', hero_bg;
  END IF;
  
  -- Check logo
  SELECT logo_url INTO logo
  FROM home_hero_settings
  WHERE id = '00000000-0000-0000-0000-000000000001';
  
  IF logo = '/logo/nciw_no_background-1024x577.png' THEN
    RAISE NOTICE 'Logo URL: OK';
  ELSE
    RAISE WARNING 'Logo URL may be incorrect: %', logo;
  END IF;
END $$;
