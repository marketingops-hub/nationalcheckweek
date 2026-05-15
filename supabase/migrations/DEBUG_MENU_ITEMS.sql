-- Debug: Check menu_items table structure and data

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'menu_items'
) as table_exists;

-- Show all menu items
SELECT * FROM menu_items 
WHERE parent_id IS NULL
ORDER BY position;

-- Show count
SELECT COUNT(*) as total_menu_items FROM menu_items WHERE parent_id IS NULL;
