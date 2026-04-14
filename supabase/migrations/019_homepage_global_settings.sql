-- Homepage Global Settings Table
-- Stores global color scheme and theme settings for all homepage blocks

CREATE TABLE IF NOT EXISTS homepage_global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_homepage_global_settings_key ON homepage_global_settings(setting_key);

-- Enable Row Level Security
ALTER TABLE homepage_global_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Public can view global settings"
  ON homepage_global_settings
  FOR SELECT
  USING (true);

-- Policy: Allow authenticated users to manage settings
CREATE POLICY "Authenticated users can manage global settings"
  ON homepage_global_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_homepage_global_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER homepage_global_settings_updated_at
  BEFORE UPDATE ON homepage_global_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_homepage_global_settings_updated_at();

-- Insert default global color settings
INSERT INTO homepage_global_settings (setting_key, setting_value) VALUES
(
  'global_colors',
  '{
    "primaryButton": "#29B8E8",
    "primaryButtonText": "#FFFFFF",
    "secondaryButton": "rgba(255,255,255,0.2)",
    "secondaryButtonText": "#FFFFFF",
    "heading": "#0f0e1a",
    "subheading": "#4a4768",
    "accentColor": "#29B8E8",
    "backgroundColor": "#FFFFFF",
    "textColor": "#1e1b33",
    "ctaBackground": "#0B1D35",
    "ctaText": "#FFFFFF",
    "ctaPrimaryButton": "#29B8E8",
    "borderColor": "#e4e2ec",
    "mutedText": "#7b78a0"
  }'::jsonb
)
ON CONFLICT (setting_key) DO NOTHING;

-- Add comment
COMMENT ON TABLE homepage_global_settings IS 'Global theme settings for homepage blocks including color scheme, typography, and other shared settings';
