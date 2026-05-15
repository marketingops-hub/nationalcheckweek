-- Update events table to use HubSpot form ID and portal ID instead of URL
ALTER TABLE events DROP COLUMN IF EXISTS hubspot_form_url;
ALTER TABLE events ADD COLUMN IF NOT EXISTS hubspot_form_id TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS hubspot_portal_id TEXT;

COMMENT ON COLUMN events.hubspot_form_id IS 'HubSpot form ID for event registration';
COMMENT ON COLUMN events.hubspot_portal_id IS 'HubSpot portal ID for event registration';
