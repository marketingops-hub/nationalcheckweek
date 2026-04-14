-- ═══════════════════════════════════════════════════════════════════
-- PARTNERS TABLE
-- Manage partner organizations displayed on the website
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "Partner" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  "logoUrl" TEXT,
  url TEXT,
  slug TEXT NOT NULL UNIQUE,
  "sortOrder" INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_partner_slug ON "Partner"(slug);

-- Index for active partners ordered by sortOrder
CREATE INDEX IF NOT EXISTS idx_partner_active_sort ON "Partner"(active, "sortOrder") WHERE active = true;

-- RLS Policies
ALTER TABLE "Partner" ENABLE ROW LEVEL SECURITY;

-- Public can view active partners
CREATE POLICY "Public can view active partners"
  ON "Partner"
  FOR SELECT
  USING (active = true);

-- Admins can do everything
CREATE POLICY "Admins can manage partners"
  ON "Partner"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Seed some example partners
INSERT INTO "Partner" (name, description, "logoUrl", url, slug, "sortOrder", active) VALUES
('Australian Government Department of Education', 'Supporting student wellbeing initiatives across Australia', null, 'https://www.education.gov.au', 'dept-education', 1, true),
('Beyond Blue', 'Providing mental health support and resources for young Australians', null, 'https://www.beyondblue.org.au', 'beyond-blue', 2, true),
('Headspace', 'Youth mental health foundation providing early intervention services', null, 'https://www.headspace.org.au', 'headspace', 3, true),
('Black Dog Institute', 'Research and treatment for mental health conditions', null, 'https://www.blackdoginstitute.org.au', 'black-dog-institute', 4, true)
ON CONFLICT (slug) DO NOTHING;

-- Comment
COMMENT ON TABLE "Partner" IS 'Partner organizations displayed on the website';
