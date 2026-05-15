-- Fix logo URL to use public folder instead of Supabase Storage
-- This ensures the logo displays correctly on the new deployment

-- Ensure the row exists first
INSERT INTO home_hero_settings (
  id,
  logo_url,
  logo_height,
  primary_cta_text,
  primary_cta_link
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '/logo/nciw_no_background-1024x577.png',
  60,
  'Register Now',
  '/events'
)
ON CONFLICT (id) DO UPDATE
SET logo_url = '/logo/nciw_no_background-1024x577.png';

-- Verification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM home_hero_settings 
    WHERE id = '00000000-0000-0000-0000-000000000001'
    AND logo_url = '/logo/nciw_no_background-1024x577.png'
  ) THEN
    RAISE NOTICE 'Logo URL updated successfully';
  ELSE
    RAISE NOTICE 'Logo URL update may have failed or row does not exist';
  END IF;
END $$;
