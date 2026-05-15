-- Hide the old ambassadors block since it's replaced by ambassador_voices
-- The ambassador_voices block shows the same heading/description + alternating layout
-- This prevents duplication on the homepage

UPDATE homepage_blocks
SET is_visible = false
WHERE block_type = 'ambassadors';

DO $$
BEGIN
  RAISE NOTICE 'Old ambassadors block hidden. ambassador_voices block now handles this section.';
END $$;
