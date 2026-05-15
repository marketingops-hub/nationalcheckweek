-- Update register page with HubSpot form IDs

UPDATE register_page
SET 
  hubspot_portal_id = '4596264',
  hubspot_form_id = '39d34e87-dd2e-4f88-8434-fc42555bea5c'
WHERE id IS NOT NULL;

-- Verify the update
SELECT id, heading, hubspot_portal_id, hubspot_form_id
FROM register_page;
