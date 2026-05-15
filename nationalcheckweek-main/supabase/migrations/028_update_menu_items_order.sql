-- Update menu items to match correct order and labels

-- Update labels and positions
UPDATE menu_items SET label = 'Home', position = 0 WHERE href = '/';
UPDATE menu_items SET label = 'About', position = 1 WHERE href = '/about';
UPDATE menu_items SET label = 'Meet Our Ambassadors', position = 2 WHERE href = '/ambassadors';
UPDATE menu_items SET label = 'Events', position = 3 WHERE href = '/events';
UPDATE menu_items SET label = 'Partners', position = 4 WHERE href = '/partners';
UPDATE menu_items SET label = 'Resources', position = 5 WHERE href = '/resources';
UPDATE menu_items SET label = 'FAQ', position = 6 WHERE href = '/faq';
UPDATE menu_items SET label = 'Contact Us', position = 7 WHERE href = '/contact';
UPDATE menu_items SET label = 'Register NOW', position = 8 WHERE href = '/register';

-- Verify the update
SELECT id, label, href, position, is_active
FROM menu_items
WHERE parent_id IS NULL
ORDER BY position;
