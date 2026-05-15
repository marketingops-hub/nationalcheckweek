-- Fix Partner table RLS policies and ensure unique constraint exists
-- The original admin policy had incorrect logic
-- Service role key bypasses RLS automatically, so we just need proper policies

-- Drop the broken admin policy
DROP POLICY IF EXISTS "Admins can manage partners" ON "Partner";

-- Ensure unique constraint on slug exists (migration 012 should have created this, but verify)
ALTER TABLE "Partner" DROP CONSTRAINT IF EXISTS "Partner_slug_key";
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_slug_key" UNIQUE (slug);

-- Temporarily disable RLS to verify data exists
-- (Service role bypasses RLS anyway, but this helps with debugging)
ALTER TABLE "Partner" DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE "Partner" ENABLE ROW LEVEL SECURITY;

-- Public can view active partners (unchanged)
-- This policy already exists, no need to recreate

-- Service role has full access (bypasses RLS automatically)
-- No policy needed - service role key bypasses all RLS

-- Verify seed data exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Partner" LIMIT 1) THEN
    -- Re-insert seed data if table is empty
    INSERT INTO "Partner" (name, description, "logoUrl", url, slug, "sortOrder", active) VALUES
    ('Australian Government Department of Education', 'Supporting student wellbeing initiatives across Australia', null, 'https://www.education.gov.au', 'dept-education', 1, true),
    ('Beyond Blue', 'Providing mental health support and resources for young Australians', null, 'https://www.beyondblue.org.au', 'beyond-blue', 2, true),
    ('Headspace', 'Youth mental health foundation providing early intervention services', null, 'https://www.headspace.org.au', 'headspace', 3, true),
    ('Black Dog Institute', 'Research and treatment for mental health conditions', null, 'https://www.blackdoginstitute.org.au', 'black-dog-institute', 4, true)
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;
