-- ═══════════════════════════════════════════════════════════════════
-- VOICE BLOCK SETTINGS
-- Seeds default content for the Your Voice CTA block that appears
-- on every Issue page. Managed via /admin/voice.
-- ═══════════════════════════════════════════════════════════════════

-- Ensure site_settings table exists (created in earlier migration)
CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS if not already enabled
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public SELECT — voice content is displayed to all visitors
DROP POLICY IF EXISTS "Public read site_settings" ON site_settings;
CREATE POLICY "Public read site_settings" ON site_settings
  FOR SELECT USING (true);

-- Authenticated write — service role handles writes from API routes
DROP POLICY IF EXISTS "Auth write site_settings" ON site_settings;
CREATE POLICY "Auth write site_settings" ON site_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- ── Seed voice block defaults (INSERT only if row does not exist) ──
INSERT INTO site_settings (key, value) VALUES
  ('voice_heading',  'Your voice matters'),
  ('voice_body',     E'We are inviting educators, parents and carers to share what they are seeing in the lives of children and young people today.\n\nYour perspective is valuable. Your insight is important. What you share can help shape a stronger response for young people.'),
  ('voice_cta_text', 'Join the Conversation'),
  ('voice_cta_url',  '/your-voice'),
  ('voice_enabled',  'true')
ON CONFLICT (key) DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE 'Voice block settings seeded successfully';
END $$;
