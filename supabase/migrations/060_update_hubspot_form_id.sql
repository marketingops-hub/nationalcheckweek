-- ═══════════════════════════════════════════════════════════════════
-- Update HubSpot form ID across all tables
-- Old: 39d34e87-dd2e-4f88-8434-fc42555bea5c
-- New: 3aa37a3b-fbbf-4da7-8864-72fd1d78ece5
-- Run each block separately in Supabase SQL Editor if needed.
-- ═══════════════════════════════════════════════════════════════════

-- Step 1: Check which tables exist and what form IDs are stored
SELECT 'events' AS tbl, slug AS key, hubspot_form_id AS form_id
FROM events WHERE hubspot_form_id IS NOT NULL AND hubspot_form_id != '';

-- Step 2: Update events table
UPDATE events
SET hubspot_form_id = '3aa37a3b-fbbf-4da7-8864-72fd1d78ece5',
    updated_at = now()
WHERE hubspot_form_id = '39d34e87-dd2e-4f88-8434-fc42555bea5c';

-- Step 3: Update register_page table
UPDATE register_page
SET hubspot_form_id = '3aa37a3b-fbbf-4da7-8864-72fd1d78ece5'
WHERE hubspot_form_id = '39d34e87-dd2e-4f88-8434-fc42555bea5c';

-- Step 4: Update homepage_blocks (How to Participate block)
-- If this errors with "relation does not exist", check your table name:
--   SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%block%' OR table_name LIKE '%home%';
UPDATE homepage_blocks
SET content = jsonb_set(content, '{hubspotFormId}', '"3aa37a3b-fbbf-4da7-8864-72fd1d78ece5"')
WHERE content->>'hubspotFormId' = '39d34e87-dd2e-4f88-8434-fc42555bea5c';
