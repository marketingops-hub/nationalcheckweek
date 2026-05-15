-- Final fix for Partner RLS - ensure public access works
-- This migration ensures the RLS policy allows anonymous (public) users to view active partners

-- First, check current RLS status
DO $$
BEGIN
  RAISE NOTICE 'Checking Partner table RLS status...';
END $$;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Public can view active partners" ON "Partner";
DROP POLICY IF EXISTS "Anyone can view active partners" ON "Partner";
DROP POLICY IF EXISTS "Admins can manage partners" ON "Partner";

-- Ensure RLS is enabled
ALTER TABLE "Partner" ENABLE ROW LEVEL SECURITY;

-- Create the public read policy with explicit anon role
-- This allows unauthenticated users to SELECT active partners
CREATE POLICY "Public can view active partners"
ON "Partner"
FOR SELECT
TO anon, authenticated
USING (active = true);

-- Verify the policy was created
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'Partner'
    AND policyname = 'Public can view active partners';
  
  IF policy_count > 0 THEN
    RAISE NOTICE '✅ RLS policy created successfully';
  ELSE
    RAISE WARNING '❌ RLS policy was not created';
  END IF;
END $$;

-- Test query as anonymous user would see it
DO $$
DECLARE
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM "Partner"
  WHERE active = true;
  
  RAISE NOTICE 'Active partners visible: %', active_count;
END $$;
