-- ═══════════════════════════════════════════════════════════════════
-- TYPOGRAPHY SETTINGS
-- Admin-controlled typography system for frontend
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Typography Settings Table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS typography_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- H1 Heading
  h1_font_family TEXT NOT NULL DEFAULT 'Montserrat',
  h1_font_size TEXT NOT NULL DEFAULT 'clamp(2.4rem, 5vw, 3.75rem)',
  h1_font_weight TEXT NOT NULL DEFAULT '900',
  h1_line_height TEXT NOT NULL DEFAULT '1.1',
  
  -- H2 Heading
  h2_font_family TEXT NOT NULL DEFAULT 'Montserrat',
  h2_font_size TEXT NOT NULL DEFAULT 'clamp(1.75rem, 3vw, 2.5rem)',
  h2_font_weight TEXT NOT NULL DEFAULT '800',
  h2_line_height TEXT NOT NULL DEFAULT '1.2',
  
  -- H3 Heading
  h3_font_family TEXT NOT NULL DEFAULT 'Montserrat',
  h3_font_size TEXT NOT NULL DEFAULT '1.3rem',
  h3_font_weight TEXT NOT NULL DEFAULT '700',
  h3_line_height TEXT NOT NULL DEFAULT '1.3',
  
  -- Body Text
  body_font_family TEXT NOT NULL DEFAULT 'Poppins',
  body_font_size TEXT NOT NULL DEFAULT '16px',
  body_font_weight TEXT NOT NULL DEFAULT '400',
  body_line_height TEXT NOT NULL DEFAULT '1.7',
  
  -- Navigation
  nav_font_family TEXT NOT NULL DEFAULT 'Poppins',
  nav_font_size TEXT NOT NULL DEFAULT '14px',
  nav_font_weight TEXT NOT NULL DEFAULT '600',
  
  -- Footer
  footer_font_family TEXT NOT NULL DEFAULT 'Poppins',
  footer_font_size TEXT NOT NULL DEFAULT '14px',
  footer_font_weight TEXT NOT NULL DEFAULT '400',
  
  -- Subtitle/Lead Text
  subtitle_font_family TEXT NOT NULL DEFAULT 'Poppins',
  subtitle_font_size TEXT NOT NULL DEFAULT '1.1rem',
  subtitle_font_weight TEXT NOT NULL DEFAULT '400',
  subtitle_line_height TEXT NOT NULL DEFAULT '1.6',
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Enable RLS ──────────────────────────────────────────────────
ALTER TABLE typography_settings ENABLE ROW LEVEL SECURITY;

-- Public read access (for CSS generation)
DROP POLICY IF EXISTS "Public read typography_settings" ON typography_settings;
CREATE POLICY "Public read typography_settings" ON typography_settings 
  FOR SELECT USING (true);

-- Authenticated write access (admin only in practice)
DROP POLICY IF EXISTS "Auth write typography_settings" ON typography_settings;
CREATE POLICY "Auth write typography_settings" ON typography_settings 
  FOR ALL USING (auth.role() = 'authenticated');

-- ── 3. Create updated_at trigger ───────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS typography_settings_updated_at ON typography_settings;
CREATE TRIGGER typography_settings_updated_at 
  BEFORE UPDATE ON typography_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 4. Insert default settings ─────────────────────────────────────
-- Use a fixed UUID so we always have exactly one row
INSERT INTO typography_settings (id) 
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ── 5. Verification ────────────────────────────────────────────────
DO $$ 
BEGIN
  RAISE NOTICE 'Typography settings table created successfully';
END $$;
