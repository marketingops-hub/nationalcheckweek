-- Add HubSpot form IDs to How to Participate block

UPDATE homepage_blocks
SET content = content || jsonb_build_object(
  'hubspotPortalId', '4596264',
  'hubspotFormId', '39d34e87-dd2e-4f88-8434-fc42555bea5c',
  'hubspotRegion', 'ap1'
)
WHERE block_type = 'how_to_participate';
