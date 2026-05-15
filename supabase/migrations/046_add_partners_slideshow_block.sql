-- Add Partners Slideshow homepage block
-- This block replaces the static logos block with a live dynamic slideshow
-- that reads from the Partner table (logo, name, description)

-- Hide the old static logos block
UPDATE homepage_blocks
SET is_visible = false
WHERE block_type = 'logos';

-- Insert new live partners slideshow block
INSERT INTO homepage_blocks (block_type, title, content, display_order, is_visible)
VALUES (
  'partners_slideshow',
  'Our Partners',
  '{"heading": "Our Partners"}'::jsonb,
  (SELECT COALESCE(MAX(display_order), 0) + 10 FROM homepage_blocks),
  true
)
ON CONFLICT DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE 'Partners Slideshow block inserted. Old logos block hidden.';
END $$;
