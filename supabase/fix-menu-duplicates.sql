-- ═══════════════════════════════════════════════════════
--  Fix duplicate menu_items rows
--  Run this once in the Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- Step 1: Delete duplicate rows, keeping the one with the lowest position value
DELETE FROM menu_items
WHERE id NOT IN (
  SELECT DISTINCT ON (href) id
  FROM menu_items
  ORDER BY href, position ASC, created_at ASC
);

-- Step 2: Add a unique constraint on href so duplicates can never be inserted again
ALTER TABLE menu_items
  ADD CONSTRAINT menu_items_href_unique UNIQUE (href);

-- Step 3: Verify — should see exactly 5 rows
SELECT id, label, href, position, is_active
FROM menu_items
ORDER BY position;
