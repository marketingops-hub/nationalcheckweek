-- ═══════════════════════════════════════════════════════════════════
-- FAQ TABLE
-- Frequently Asked Questions management
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "Faq" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  "sortOrder" INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active FAQs ordered by sortOrder
CREATE INDEX IF NOT EXISTS idx_faq_active_sort ON "Faq"(active, "sortOrder") WHERE active = true;

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_faq_category ON "Faq"(category) WHERE category IS NOT NULL;

-- RLS Policies
ALTER TABLE "Faq" ENABLE ROW LEVEL SECURITY;

-- Public can view active FAQs (create only if doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'Faq' 
    AND policyname = 'Public can view active FAQs'
  ) THEN
    CREATE POLICY "Public can view active FAQs"
      ON "Faq"
      FOR SELECT
      USING (active = true);
  END IF;
END $$;

-- Service role has full access (bypasses RLS automatically)
-- No policy needed - service role key bypasses all RLS

-- Seed some example FAQs
INSERT INTO "Faq" (question, answer, category, "sortOrder", active) VALUES
('What is Schools Wellbeing Australia?', 'Schools Wellbeing Australia is a national initiative dedicated to improving student mental health and wellbeing across Australian schools. We provide resources, support, and events to help schools create healthier learning environments.', 'General', 1, true),
('How can my school participate?', 'Schools can participate by registering for our events, accessing our free resources, and joining our network of wellbeing-focused educators. Visit our events page to see upcoming opportunities.', 'General', 2, true),
('What resources are available?', 'We offer a comprehensive library of evidence-based resources including mental health toolkits, classroom activities, parent guides, and professional development materials. All resources are free and aligned with Australian curriculum standards.', 'Resources', 3, true),
('Is there a cost to participate?', 'Most of our resources and programs are completely free for Australian schools. Some specialized workshops or events may have a nominal fee to cover costs, but we strive to keep everything accessible.', 'General', 4, true),
('How do I contact support?', 'You can reach our support team via email at support@schoolswellbeing.org.au or call our helpline during business hours. We typically respond within 24 hours.', 'Support', 5, true)
ON CONFLICT DO NOTHING;

-- Comment
COMMENT ON TABLE "Faq" IS 'Frequently Asked Questions displayed on the website';
