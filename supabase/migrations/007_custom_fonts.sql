-- ═══════════════════════════════════════════════════════════════════
-- CUSTOM FONTS
-- Admin font upload and management system
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Custom Fonts Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_fonts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  font_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_format TEXT NOT NULL CHECK (file_format IN ('woff2', 'woff', 'ttf')),
  file_size INTEGER NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- ── 2. Enable RLS ──────────────────────────────────────────────────
ALTER TABLE custom_fonts ENABLE ROW LEVEL SECURITY;

-- Public read access (for CSS generation)
DROP POLICY IF EXISTS "Public read custom_fonts" ON custom_fonts;
CREATE POLICY "Public read custom_fonts" ON custom_fonts 
  FOR SELECT USING (is_active = true);

-- Authenticated write access (admin only in practice)
DROP POLICY IF EXISTS "Auth write custom_fonts" ON custom_fonts;
CREATE POLICY "Auth write custom_fonts" ON custom_fonts 
  FOR ALL USING (auth.role() = 'authenticated');

-- ── 3. Create indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS custom_fonts_active_idx ON custom_fonts (is_active);
CREATE INDEX IF NOT EXISTS custom_fonts_font_name_idx ON custom_fonts (font_name);

-- ── 4. Verification ────────────────────────────────────────────────
DO $$ 
BEGIN
  RAISE NOTICE 'Custom fonts table created successfully';
END $$;
