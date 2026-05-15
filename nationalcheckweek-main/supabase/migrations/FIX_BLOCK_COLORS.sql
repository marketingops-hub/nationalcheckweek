-- Fix block colors to match original homepage design
-- Original brand color: #29B8E8 (blue), not #5925f4 (purple)

UPDATE homepage_blocks 
SET content = jsonb_set(content, '{accentColor}', '"#29B8E8"')
WHERE block_type IN ('schools_navigating_data', 'wellbeing_across_australia');

-- Also update CTA block background to match original
UPDATE homepage_blocks 
SET content = jsonb_set(
  jsonb_set(content, '{backgroundColor}', '"#0B1D35"'),
  '{textColor}', '"#FFFFFF"'
)
WHERE block_type = 'cta';
