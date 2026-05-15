-- Update register page with correct HubSpot form configuration
-- Form ID: 39d34e87-dd2e-4f88-8434-fc42555bea5c
-- Portal ID: 4596264
-- Region: ap1

-- Update all existing rows
UPDATE register_page
SET 
  hubspot_portal_id = '4596264',
  hubspot_form_id = '39d34e87-dd2e-4f88-8434-fc42555bea5c',
  updated_at = NOW();

-- If no rows exist, insert a default row
INSERT INTO register_page (
  heading,
  subheading,
  description,
  hubspot_portal_id,
  hubspot_form_id,
  seo_title,
  seo_description,
  right_column_content
)
SELECT
  'Register for National Check-In Week 2026',
  'Join leading educators, psychologists, and experts',
  'Complete the form to register your school and gain access to free webinars, professional development sessions, and exclusive resources.',
  '4596264',
  '39d34e87-dd2e-4f88-8434-fc42555bea5c',
  'Register — National Check-in Week 2026',
  'Register your school for National Check-in Week 2026 and access free webinars, resources, and expert insights on student wellbeing.',
  '[
    {
      "type": "heading",
      "content": "What You''ll Get"
    },
    {
      "type": "list",
      "items": [
        "Access to FREE webinars and live events",
        "Professional development sessions",
        "Expert-led discussions on student wellbeing",
        "Practical resources for schools and families",
        "Two weeks of access to Life Skills GO platform",
        "Real-time wellbeing insights and reporting"
      ]
    },
    {
      "type": "heading",
      "content": "Why Register?"
    },
    {
      "type": "paragraph",
      "content": "National Check-In Week 2026 brings together the data, the issues, and the experts to create meaningful change in student wellbeing across Australia."
    }
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM register_page LIMIT 1);

-- Verify the update
DO $$
DECLARE
  form_id TEXT;
  portal_id TEXT;
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM register_page;
  
  IF row_count = 0 THEN
    RAISE WARNING 'No rows in register_page table';
  ELSE
    SELECT hubspot_form_id, hubspot_portal_id INTO form_id, portal_id
    FROM register_page
    LIMIT 1;
    
    IF form_id = '39d34e87-dd2e-4f88-8434-fc42555bea5c' AND portal_id = '4596264' THEN
      RAISE NOTICE 'SUCCESS: HubSpot form configuration updated';
      RAISE NOTICE 'Portal ID: %, Form ID: %', portal_id, form_id;
      RAISE NOTICE 'Total rows in register_page: %', row_count;
    ELSE
      RAISE WARNING 'HubSpot form not updated correctly. Portal: %, Form: %', portal_id, form_id;
    END IF;
  END IF;
END $$;
