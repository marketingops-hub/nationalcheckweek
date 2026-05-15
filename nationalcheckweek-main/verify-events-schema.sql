-- Verify events table has the new HubSpot fields
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
  AND column_name IN ('hubspot_form_url', 'hubspot_form_id', 'hubspot_portal_id')
ORDER BY column_name;
