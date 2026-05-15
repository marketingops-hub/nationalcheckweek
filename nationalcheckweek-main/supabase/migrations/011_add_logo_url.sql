-- Add link_url field to home_trusted_logos table
-- This allows logos to be clickable and link to organization websites

ALTER TABLE home_trusted_logos 
ADD COLUMN IF NOT EXISTS link_url TEXT;

-- Add comment
COMMENT ON COLUMN home_trusted_logos.link_url IS 'Optional URL to link to when logo is clicked';
