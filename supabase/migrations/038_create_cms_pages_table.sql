-- Create CMS Pages table
-- This table stores CMS-managed pages like privacy policy, terms of service, etc.

CREATE TABLE IF NOT EXISTS cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON cms_pages(slug);

-- Index for published pages
CREATE INDEX IF NOT EXISTS idx_cms_pages_published ON cms_pages(published) WHERE published = true;

-- RLS Policies
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;

-- Public can view published pages
CREATE POLICY "Public can view published pages"
  ON cms_pages
  FOR SELECT
  TO anon, authenticated
  USING (published = true);

-- Comment
COMMENT ON TABLE cms_pages IS 'CMS-managed pages like privacy policy, terms of service, etc.';

-- Verify table was created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cms_pages') THEN
    RAISE NOTICE 'SUCCESS: cms_pages table created';
  ELSE
    RAISE WARNING 'cms_pages table was not created';
  END IF;
END $$;
