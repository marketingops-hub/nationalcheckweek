-- ═══════════════════════════════════════════════════════════════════
-- RESOURCES TABLE
-- Manage educational resources displayed on the website
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "Resource" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  "thumbnailUrl" TEXT,
  url TEXT,
  slug TEXT NOT NULL UNIQUE,
  category TEXT, -- e.g., "Wellbeing", "Mental Health", "Teaching Tools"
  "sortOrder" INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_resource_slug ON "Resource"(slug);

-- Index for active resources ordered by sortOrder
CREATE INDEX IF NOT EXISTS idx_resource_active_sort ON "Resource"(active, "sortOrder") WHERE active = true;

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_resource_category ON "Resource"(category) WHERE active = true;

-- RLS Policies
ALTER TABLE "Resource" ENABLE ROW LEVEL SECURITY;

-- Public can view active resources
CREATE POLICY "Public can view active resources"
  ON "Resource"
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- Seed some example resources
INSERT INTO "Resource" (name, description, "thumbnailUrl", url, slug, category, "sortOrder", active) VALUES
('Student Wellbeing Toolkit', 'Comprehensive guide for supporting student mental health and wellbeing in schools', null, 'https://example.com/toolkit', 'student-wellbeing-toolkit', 'Wellbeing', 1, true),
('Mental Health First Aid', 'Training resources for teachers to recognize and respond to mental health issues', null, 'https://example.com/mhfa', 'mental-health-first-aid', 'Mental Health', 2, true),
('Classroom Mindfulness Guide', 'Practical mindfulness exercises and activities for daily classroom use', null, 'https://example.com/mindfulness', 'classroom-mindfulness-guide', 'Teaching Tools', 3, true),
('Bullying Prevention Resources', 'Evidence-based strategies and materials for preventing and addressing bullying', null, 'https://example.com/bullying', 'bullying-prevention', 'Wellbeing', 4, true)
ON CONFLICT (slug) DO NOTHING;

-- Comment
COMMENT ON TABLE "Resource" IS 'Educational resources displayed on the website';
