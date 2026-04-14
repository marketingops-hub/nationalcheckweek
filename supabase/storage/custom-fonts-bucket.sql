-- ═══════════════════════════════════════════════════════════════════
-- CUSTOM FONTS STORAGE BUCKET
-- Supabase Storage configuration for font uploads
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Create Storage Bucket ───────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('custom-fonts', 'custom-fonts', true)
ON CONFLICT (id) DO NOTHING;

-- ── 2. Storage Policies ────────────────────────────────────────────

-- Public read access (for @font-face URLs)
DROP POLICY IF EXISTS "Public read custom-fonts" ON storage.objects;
CREATE POLICY "Public read custom-fonts" ON storage.objects
  FOR SELECT USING (bucket_id = 'custom-fonts');

-- Authenticated upload access (admin only in practice)
DROP POLICY IF EXISTS "Auth upload custom-fonts" ON storage.objects;
CREATE POLICY "Auth upload custom-fonts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'custom-fonts' 
    AND auth.role() = 'authenticated'
  );

-- Authenticated delete access (admin only in practice)
DROP POLICY IF EXISTS "Auth delete custom-fonts" ON storage.objects;
CREATE POLICY "Auth delete custom-fonts" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'custom-fonts' 
    AND auth.role() = 'authenticated'
  );

-- ── 3. Verification ────────────────────────────────────────────────
DO $$ 
BEGIN
  RAISE NOTICE 'Custom fonts storage bucket created successfully';
END $$;
