-- Fix state links in homepage blocks to use full state names instead of abbreviations
-- Issue: Links were using /states/qld, /states/nsw, etc. instead of full names
-- Solution: Update all state links to use proper slugs

-- Update WellbeingAcrossAustraliaBlock state links
UPDATE homepage_blocks
SET content = jsonb_set(
  content,
  '{states}',
  (
    SELECT jsonb_agg(
      CASE 
        WHEN state->>'link' = '/states/nsw' THEN jsonb_set(state, '{link}', '"/states/new-south-wales"')
        WHEN state->>'link' = '/states/vic' THEN jsonb_set(state, '{link}', '"/states/victoria"')
        WHEN state->>'link' = '/states/qld' THEN jsonb_set(state, '{link}', '"/states/queensland"')
        WHEN state->>'link' = '/states/wa' THEN jsonb_set(state, '{link}', '"/states/western-australia"')
        WHEN state->>'link' = '/states/sa' THEN jsonb_set(state, '{link}', '"/states/south-australia"')
        WHEN state->>'link' = '/states/tas' THEN jsonb_set(state, '{link}', '"/states/tasmania"')
        WHEN state->>'link' = '/states/nt' THEN jsonb_set(state, '{link}', '"/states/northern-territory"')
        WHEN state->>'link' = '/states/act' THEN jsonb_set(state, '{link}', '"/states/australian-capital-territory"')
        ELSE state
      END
    )
    FROM jsonb_array_elements(content->'states') AS state
  )
)
WHERE block_type = 'wellbeing_across_australia'
  AND content ? 'states';

-- Verify the update
DO $$
DECLARE
  block_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO block_count
  FROM homepage_blocks
  WHERE block_type = 'wellbeing_across_australia'
    AND content ? 'states';
  
  RAISE NOTICE 'Updated % WellbeingAcrossAustraliaBlock(s)', block_count;
END $$;
