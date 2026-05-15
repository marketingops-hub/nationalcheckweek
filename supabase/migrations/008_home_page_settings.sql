-- ═══════════════════════════════════════════════════════════════════
-- HOME PAGE SETTINGS
-- Admin-controlled home page content management
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Hero Section Settings ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS home_hero_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  
  -- Logo
  logo_url TEXT,
  logo_height INTEGER DEFAULT 44,
  
  -- Event Badge
  event_date TEXT DEFAULT '25 May 2026',
  event_location TEXT DEFAULT 'Australia',
  event_emoji TEXT DEFAULT '📅',
  
  -- Main Content
  heading_line1 TEXT DEFAULT 'Student Wellbeing:',
  heading_line2 TEXT DEFAULT 'A National Priority.',
  subheading TEXT DEFAULT 'Join Australia''s leading student wellbeing event — bridging data, experts and schools to create lasting change.',
  
  -- CTAs
  primary_cta_text TEXT DEFAULT 'Register Now',
  primary_cta_link TEXT DEFAULT '/events',
  secondary_cta_text TEXT DEFAULT 'Learn More',
  secondary_cta_link TEXT DEFAULT '/about',
  
  -- Hero Image
  hero_image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000',
  
  -- Countdown
  countdown_target_date TIMESTAMPTZ DEFAULT '2026-05-25T00:00:00+10:00',
  countdown_label TEXT DEFAULT 'Countdown to the event',
  show_countdown BOOLEAN DEFAULT true,
  
  -- Floating Stats Card
  stats_value TEXT DEFAULT '15M+',
  stats_label TEXT DEFAULT 'Students reached annually',
  stats_icon TEXT DEFAULT 'Users',
  show_stats_card BOOLEAN DEFAULT true,
  
  -- Badge
  badge_text TEXT DEFAULT '✓ 1,200+ Schools',
  show_badge BOOLEAN DEFAULT true,
  
  -- Styling
  background_color TEXT DEFAULT '#FFFFFF',
  heading_color TEXT DEFAULT '#0B1D35',
  subheading_color TEXT DEFAULT '#475569',
  primary_button_bg TEXT DEFAULT '#29B8E8',
  primary_button_text TEXT DEFAULT '#FFFFFF',
  secondary_button_bg TEXT DEFAULT '#FFFFFF',
  secondary_button_text TEXT DEFAULT '#29B8E8',
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Trusted Organizations Logos ────────────────────────────────
CREATE TABLE IF NOT EXISTS home_trusted_logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. CTA Banner Settings ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS home_cta_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000002',
  
  eyebrow_text TEXT DEFAULT 'Join the Movement',
  heading_text TEXT DEFAULT 'Ready to Make Student Wellbeing a Priority?',
  description_text TEXT DEFAULT 'Join 1,200+ schools across Australia in the largest student wellbeing initiative. Register now for National Check-in Week 2026.',
  
  primary_cta_text TEXT DEFAULT 'Register Your School',
  primary_cta_link TEXT DEFAULT '/events',
  secondary_cta_text TEXT DEFAULT 'Download Resources',
  secondary_cta_link TEXT DEFAULT '/about',
  
  background_color TEXT DEFAULT '#0B1D35',
  text_color TEXT DEFAULT '#FFFFFF',
  eyebrow_color TEXT DEFAULT '#29B8E8',
  primary_button_bg TEXT DEFAULT '#29B8E8',
  primary_button_text TEXT DEFAULT '#FFFFFF',
  secondary_button_bg TEXT DEFAULT '#FFFFFF',
  secondary_button_text TEXT DEFAULT '#0B1D35',
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Footer Settings ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS home_footer_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000003',
  
  logo_url TEXT,
  brand_description TEXT DEFAULT 'Australia''s leading student wellbeing initiative, bringing together schools, experts, and communities.',
  
  contact_phone TEXT DEFAULT '+61 02 555 505',
  contact_fax TEXT DEFAULT '100 888 992',
  contact_email TEXT DEFAULT 'events@nationalcheckinweek.com',
  
  copyright_text TEXT DEFAULT 'Copyright © 2026 National Check-In Week. All rights reserved.',
  
  background_color TEXT DEFAULT '#0B1D35',
  text_color TEXT DEFAULT 'rgba(255,255,255,0.7)',
  heading_color TEXT DEFAULT '#FFFFFF',
  link_color TEXT DEFAULT 'rgba(255,255,255,0.7)',
  link_hover_color TEXT DEFAULT '#29B8E8',
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. Footer Quick Links ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS home_footer_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. Social Media Links ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS home_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  icon_svg_path TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. Enable RLS ──────────────────────────────────────────────────
ALTER TABLE home_hero_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_trusted_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_cta_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_footer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_footer_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_social_links ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read home_hero_settings" ON home_hero_settings FOR SELECT USING (true);
CREATE POLICY "Public read home_trusted_logos" ON home_trusted_logos FOR SELECT USING (is_active = true);
CREATE POLICY "Public read home_cta_settings" ON home_cta_settings FOR SELECT USING (true);
CREATE POLICY "Public read home_footer_settings" ON home_footer_settings FOR SELECT USING (true);
CREATE POLICY "Public read home_footer_links" ON home_footer_links FOR SELECT USING (is_active = true);
CREATE POLICY "Public read home_social_links" ON home_social_links FOR SELECT USING (is_active = true);

-- Authenticated write access
CREATE POLICY "Auth write home_hero_settings" ON home_hero_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write home_trusted_logos" ON home_trusted_logos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write home_cta_settings" ON home_cta_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write home_footer_settings" ON home_footer_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write home_footer_links" ON home_footer_links FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth write home_social_links" ON home_social_links FOR ALL USING (auth.role() = 'authenticated');

-- ── 8. Create Indexes ──────────────────────────────────────────────
CREATE INDEX home_trusted_logos_active_order_idx ON home_trusted_logos (is_active, display_order);
CREATE INDEX home_footer_links_active_order_idx ON home_footer_links (is_active, display_order);
CREATE INDEX home_social_links_active_order_idx ON home_social_links (is_active, display_order);

-- ── 9. Insert Default Data ─────────────────────────────────────────
INSERT INTO home_hero_settings (id) VALUES ('00000000-0000-0000-0000-000000000001') ON CONFLICT (id) DO NOTHING;
INSERT INTO home_cta_settings (id) VALUES ('00000000-0000-0000-0000-000000000002') ON CONFLICT (id) DO NOTHING;
INSERT INTO home_footer_settings (id) VALUES ('00000000-0000-0000-0000-000000000003') ON CONFLICT (id) DO NOTHING;

-- Default trusted logos
INSERT INTO home_trusted_logos (name, display_order) VALUES
  ('Department of Education', 1),
  ('Beyond Blue', 2),
  ('Headspace', 3),
  ('Black Dog Institute', 4),
  ('ReachOut', 5),
  ('Kids Helpline', 6)
ON CONFLICT DO NOTHING;

-- Default footer links
INSERT INTO home_footer_links (label, url, display_order) VALUES
  ('Contact Us', '/contact', 1),
  ('Privacy Policy', '/privacy', 2),
  ('Terms and Conditions', '/terms', 3)
ON CONFLICT DO NOTHING;

-- Default social links
INSERT INTO home_social_links (platform, url, icon_svg_path, display_order) VALUES
  ('Facebook', '#', 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z', 1),
  ('LinkedIn', '#', 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z', 2),
  ('Instagram', '#', 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-13h-7c-1.38 0-2.5 1.12-2.5 2.5v5c0 1.38 1.12 2.5 2.5 2.5h7c1.38 0 2.5-1.12 2.5-2.5v-5c0-1.38-1.12-2.5-2.5-2.5zm-3.5 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z', 3)
ON CONFLICT DO NOTHING;

-- ── 10. Verification ───────────────────────────────────────────────
DO $$ 
BEGIN
  RAISE NOTICE 'Home page settings tables created successfully';
END $$;
