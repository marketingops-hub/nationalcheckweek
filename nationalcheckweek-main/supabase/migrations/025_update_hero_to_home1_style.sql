-- Update homepage hero block to match /home1 styling and content

UPDATE homepage_blocks
SET content = jsonb_set(
  content,
  '{heading}',
  '"Student Wellbeing:<br />A National Priority."'
)
WHERE block_type = 'hero';

UPDATE homepage_blocks
SET content = jsonb_set(
  content,
  '{subheading}',
  '"Join Australia''s leading student wellbeing event — bridging data, experts and schools to create lasting change."'
)
WHERE block_type = 'hero';

UPDATE homepage_blocks
SET content = jsonb_set(
  content,
  '{badge}',
  '{"emoji": "📅", "text": "25 May 2026 · Australia"}'::jsonb
)
WHERE block_type = 'hero';

UPDATE homepage_blocks
SET content = jsonb_set(
  content,
  '{primaryCTA}',
  '{"text": "Register Now", "link": "/events"}'::jsonb
)
WHERE block_type = 'hero';

UPDATE homepage_blocks
SET content = jsonb_set(
  content,
  '{secondaryCTA}',
  '{"text": "Learn More", "link": "/about"}'::jsonb
)
WHERE block_type = 'hero';

UPDATE homepage_blocks
SET content = jsonb_set(
  content,
  '{backgroundImage}',
  '"https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000"'
)
WHERE block_type = 'hero';

-- Add countdown feature flag
UPDATE homepage_blocks
SET content = jsonb_set(
  content,
  '{showCountdown}',
  'true'::jsonb
)
WHERE block_type = 'hero';

-- Add countdown target date
UPDATE homepage_blocks
SET content = jsonb_set(
  content,
  '{countdownTarget}',
  '"2026-05-25T00:00:00+10:00"'
)
WHERE block_type = 'hero';

-- Add countdown label
UPDATE homepage_blocks
SET content = jsonb_set(
  content,
  '{countdownLabel}',
  '"Countdown to the event"'
)
WHERE block_type = 'hero';

-- Update colors to match /home1 dark gradient theme
UPDATE homepage_blocks
SET content = jsonb_set(
  content,
  '{colors}',
  '{
    "useGlobalColors": false,
    "heading": "#ffffff",
    "subheading": "rgba(255,255,255,0.65)",
    "primaryButton": "#29B8E8",
    "primaryButtonText": "#ffffff",
    "secondaryButton": "rgba(255,255,255,0.08)",
    "secondaryButtonText": "rgba(255,255,255,0.85)",
    "backgroundColor": "linear-gradient(135deg, #0a1628 0%, #0f2444 50%, #091d38 100%)",
    "badgeBackground": "rgba(41,184,232,0.15)",
    "badgeBorder": "rgba(41,184,232,0.3)",
    "badgeText": "#7dd3f0"
  }'::jsonb
)
WHERE block_type = 'hero';
