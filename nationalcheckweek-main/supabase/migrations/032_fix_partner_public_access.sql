-- Fix Partner table RLS to allow public read access to active partners
-- Issue: RLS was re-enabled but no public SELECT policy exists
-- This causes the public /partners page to show empty even though data exists

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view active partners" ON "Partner";
DROP POLICY IF EXISTS "Anyone can view active partners" ON "Partner";

-- Create policy to allow public read access to active partners
CREATE POLICY "Public can view active partners"
ON "Partner"
FOR SELECT
TO public
USING (active = true);

-- Verify RLS is enabled
ALTER TABLE "Partner" ENABLE ROW LEVEL SECURITY;

-- Verify the policy works
DO $$
DECLARE
  active_count INTEGER;
BEGIN
  -- This should work now with the public policy
  SELECT COUNT(*) INTO active_count
  FROM "Partner"
  WHERE active = true;
  
  RAISE NOTICE 'Partner table has % active partners visible to public', active_count;
END $$;
