-- Comprehensive homepage fixes: hero heading, stats, social links

-- 1. Update hero heading to add line breaks after each sentence
UPDATE homepage_blocks
SET content = jsonb_set(
  content,
  '{heading}',
  '"The Data.<br/>The Issues.<br/>The Experts."'
)
WHERE block_type = 'hero';

-- 2. Update stats section with correct data from the image
UPDATE homepage_blocks
SET content = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        content,
        '{stats,0}',
        jsonb_build_object(
          'value', '15 Million',
          'label', 'Student wellbeing check-ins informing the national conversation'
        )
      ),
      '{stats,1}',
      jsonb_build_object(
        'value', '1 in 7',
        'label', 'Australian children aged 4-17 experience mental illness'
      )
    ),
    '{stats,2}',
    jsonb_build_object(
      'value', '38%',
      'label', 'of Australian children aged 10-17 experienced cyberbullying in the past 12 months'
    )
  ),
  '{stats,3}',
  jsonb_build_object(
    'value', '24%',
    'label', 'of Australian children spend more than 20 hours a week on screens'
  )
)
WHERE block_type = 'stats' OR (content->>'heading' LIKE '%Impact%');

-- 3. Update social media links (if home_social_links table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'home_social_links') THEN
    -- Clear existing social links
    DELETE FROM home_social_links;
    
    -- Insert correct social links with SVG paths
    INSERT INTO home_social_links (platform, url, icon_svg_path, display_order, is_active) VALUES
    ('Facebook', 'https://www.facebook.com/groups/nationalcheckinweek/', 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z', 1, true),
    ('Twitter', 'https://x.com/CheckInWeek_', 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z', 2, true),
    ('Instagram', 'https://www.instagram.com/nationalcheckinweek', 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-13h-7c-1.38 0-2.5 1.12-2.5 2.5v5c0 1.38 1.12 2.5 2.5 2.5h7c1.38 0 2.5-1.12 2.5-2.5v-5c0-1.38-1.12-2.5-2.5-2.5zm-3.5 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z', 3, true),
    ('LinkedIn', 'https://www.linkedin.com/groups/14629770/', 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z', 4, true);
    
    RAISE NOTICE 'Social links updated successfully';
  END IF;
END $$;

-- Verification
DO $$
DECLARE
  hero_heading TEXT;
  stats_count INT;
BEGIN
  -- Check hero heading
  SELECT content->>'heading' INTO hero_heading
  FROM homepage_blocks
  WHERE block_type = 'hero'
  LIMIT 1;
  
  IF hero_heading LIKE '%<br/>%' THEN
    RAISE NOTICE 'Hero heading updated with line breaks: OK';
  ELSE
    RAISE WARNING 'Hero heading may not have line breaks: %', hero_heading;
  END IF;
  
  -- Check stats
  SELECT jsonb_array_length(content->'stats') INTO stats_count
  FROM homepage_blocks
  WHERE block_type = 'stats' OR (content->>'heading' LIKE '%Impact%')
  LIMIT 1;
  
  IF stats_count = 4 THEN
    RAISE NOTICE 'Stats section has 4 items: OK';
  ELSE
    RAISE WARNING 'Stats section may be incorrect. Count: %', stats_count;
  END IF;
END $$;
