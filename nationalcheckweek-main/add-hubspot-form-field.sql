ALTER TABLE events ADD COLUMN IF NOT EXISTS hubspot_form_url TEXT;

COMMENT ON COLUMN events.hubspot_form_url IS 'HubSpot form embed URL for event registration';
