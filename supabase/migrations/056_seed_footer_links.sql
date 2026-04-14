-- Seed footer quick links (Privacy Policy, Terms and Conditions, Sources)
BEGIN;

DELETE FROM home_footer_links WHERE url IN ('/privacy', '/terms', '/sources');

INSERT INTO home_footer_links (label, url, is_active, display_order)
VALUES
  ('Privacy Policy',       '/privacy', true, 1),
  ('Terms and Conditions', '/terms',   true, 2),
  ('Sources',              '/sources', true, 3);

COMMIT;
