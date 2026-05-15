-- Insert Ambassador Voices homepage block
-- This block displays ambassadors with alternating left/right layout
-- Each card shows: photo, name, title, comment, and event link button

INSERT INTO homepage_blocks (block_type, title, content, display_order, is_visible)
VALUES (
  'ambassador_voices',
  'Ambassador Voices',
  '{
    "heading": "A national movement driving change in student wellbeing",
    "description": "National Check-In Week is bringing together ambassadors, partners, experts, and organisations, such as those below, with a shared determination to shift the national conversation on student wellbeing. Together, they are raising visibility, strengthening understanding, and driving the collective action needed to create meaningful change for young people across Australia.",
    "buttonText": "Register for events I''m involved in here",
    "buttonColor": "#29B8E8"
  }'::jsonb,
  (SELECT COALESCE(MAX(display_order), 0) + 10 FROM homepage_blocks),
  true
)
ON CONFLICT DO NOTHING;

-- Verification
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM homepage_blocks WHERE block_type = 'ambassador_voices') THEN
    RAISE NOTICE 'Ambassador Voices block inserted successfully';
  ELSE
    RAISE EXCEPTION 'Failed to insert Ambassador Voices block';
  END IF;
END $$;
