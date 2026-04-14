-- Update hero block content with new messaging and background image
-- Changes:
-- 1. Heading: "Student Wellbeing: A National Priority" → "The Data. The Issues. The Experts."
-- 2. Subheading: Updated to new messaging
-- 3. Add new description paragraph
-- 4. Set background image to ACS_0149.JPG

UPDATE homepage_blocks
SET content = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        content,
        '{heading}',
        '"The Data. The Issues. The Experts."'
      ),
      '{subheading}',
      '"Australia''s leading FREE national student wellbeing event bringing together the data, the current issues, and the experts"'
    ),
    '{description}',
    '"Join leading neuroscientists, educators, psychologists, and experts in their field for free webinars, events, resources, and the first release of Life Skills Go''s 15 Million Student Check-In Report.\n\nNational Check-In Week 2026 brings the current landscape into focus, uniting expert insight, emerging national trends, and powerful student voice data to reveal the realities shaping young people''s lives today. It is a catalyst for deeper understanding, more informed conversation, and stronger action on the issues that can no longer be ignored."'
  ),
  '{backgroundImage}',
  '"/hero-bg.jpg"'
)
WHERE block_type = 'hero';

-- Verification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM homepage_blocks 
    WHERE block_type = 'hero' 
    AND content->>'heading' = 'The Data. The Issues. The Experts.'
  ) THEN
    RAISE NOTICE 'Hero block may not exist or update failed';
  ELSE
    RAISE NOTICE 'Hero block updated successfully';
  END IF;
END $$;
