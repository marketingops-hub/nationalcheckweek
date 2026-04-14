-- Replace menu items with correct navigation

-- Delete all existing menu items
DELETE FROM menu_items WHERE parent_id IS NULL;

-- Insert correct menu items
INSERT INTO menu_items (label, href, position, target, is_active, parent_id) VALUES
  ('Home', '/', 0, '_self', true, null),
  ('About', '/about', 1, '_self', true, null),
  ('Meet Our Ambassadors', '/ambassadors', 2, '_self', true, null),
  ('Events', '/events', 3, '_self', true, null),
  ('Partners', '/partners', 4, '_self', true, null),
  ('Resources', '/resources', 5, '_self', true, null),
  ('FAQ', '/faq', 6, '_self', true, null),
  ('Contact Us', '/contact', 7, '_self', true, null),
  ('Register NOW', '/register', 8, '_self', true, null);

-- Verify the new menu
SELECT id, label, href, position, is_active
FROM menu_items
WHERE parent_id IS NULL
ORDER BY position;
