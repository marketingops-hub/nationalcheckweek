-- Fix National Check-In Week video URL
-- Update the "What is National Check-In Week" block with correct Vimeo video

UPDATE homepage_blocks
SET content = jsonb_set(
  content,
  '{vimeoUrl}',
  '"https://player.vimeo.com/video/1084255962"'::jsonb
)
WHERE block_type = 'what_is_it'
  AND title = 'What is National Check-In Week';

-- Verify the update
DO $$
DECLARE
  video_url TEXT;
BEGIN
  SELECT content->>'vimeoUrl' INTO video_url
  FROM homepage_blocks
  WHERE block_type = 'what_is_it'
    AND title = 'What is National Check-In Week';
  
  IF video_url = 'https://player.vimeo.com/video/1084255962' THEN
    RAISE NOTICE 'SUCCESS: Video URL updated to: %', video_url;
  ELSE
    RAISE WARNING 'Video URL is: %. Expected: https://player.vimeo.com/video/1084255962', video_url;
  END IF;
END $$;
