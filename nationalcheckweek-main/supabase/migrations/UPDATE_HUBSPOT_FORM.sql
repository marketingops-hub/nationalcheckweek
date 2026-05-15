-- Quick update to add HubSpot form IDs to How to Participate block
-- Run this in your Supabase SQL editor

UPDATE homepage_blocks
SET content = content || jsonb_build_object(
  'hubspotPortalId', '4596264',
  'hubspotFormId', '39d34e87-dd2e-4f88-8434-fc42555bea5c',
  'hubspotRegion', 'ap1'
)
WHERE block_type = 'how_to_participate';

-- Verify the update
SELECT id, title, content->'hubspotPortalId' as portal_id, content->'hubspotFormId' as form_id
FROM homepage_blocks 
WHERE block_type = 'how_to_participate';
