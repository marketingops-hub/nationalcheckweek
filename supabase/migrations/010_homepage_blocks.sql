-- Modular Homepage Blocks System
-- Allows drag-and-drop reordering and editing of homepage content blocks

-- Create homepage_blocks table
CREATE TABLE IF NOT EXISTS homepage_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_type TEXT NOT NULL, -- 'hero', 'features', 'stats', 'cta', 'testimonials', 'logos', 'faq', 'contact'
  title TEXT,
  content JSONB NOT NULL DEFAULT '{}', -- Flexible content storage for each block type
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on display_order for fast sorting
CREATE INDEX IF NOT EXISTS idx_homepage_blocks_order ON homepage_blocks(display_order);

-- Create index on visibility
CREATE INDEX IF NOT EXISTS idx_homepage_blocks_visible ON homepage_blocks(is_visible);

-- Enable Row Level Security
ALTER TABLE homepage_blocks ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to visible blocks
CREATE POLICY "Public can view visible homepage blocks"
  ON homepage_blocks
  FOR SELECT
  USING (is_visible = true);

-- Policy: Allow authenticated users to manage all blocks
CREATE POLICY "Authenticated users can manage homepage blocks"
  ON homepage_blocks
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_homepage_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER homepage_blocks_updated_at
  BEFORE UPDATE ON homepage_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_homepage_blocks_updated_at();

-- Insert default homepage blocks
INSERT INTO homepage_blocks (block_type, title, content, display_order, is_visible) VALUES
(
  'hero',
  'Hero Section',
  '{
    "heading": "Student Wellbeing: A National Priority",
    "subheading": "Join Australia''s leading student wellbeing event — bridging data, experts and schools to create lasting change.",
    "primaryCTA": {"text": "Register Now", "link": "/events"},
    "secondaryCTA": {"text": "Learn More", "link": "/about"},
    "backgroundImage": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800",
    "badge": {"emoji": "📅", "text": "25 May 2026 · Australia"}
  }'::jsonb,
  1,
  true
),
(
  'stats',
  'Impact Statistics',
  '{
    "stats": [
      {"value": "1,200+", "label": "Schools Participating"},
      {"value": "15M+", "label": "Students Reached"},
      {"value": "500+", "label": "Expert Sessions"},
      {"value": "100%", "label": "Free Resources"}
    ]
  }'::jsonb,
  2,
  true
),
(
  'features',
  'Why It Matters',
  '{
    "heading": "Why Student Wellbeing Matters",
    "features": [
      {
        "icon": "psychology",
        "title": "Mental Health Crisis",
        "description": "1 in 7 Australian students experience mental health challenges. Early intervention is critical."
      },
      {
        "icon": "groups",
        "title": "Whole-School Approach",
        "description": "Effective wellbeing strategies require engagement from students, staff, and families."
      },
      {
        "icon": "trending_up",
        "title": "Data-Driven Insights",
        "description": "Evidence-based approaches help schools measure impact and improve outcomes."
      }
    ]
  }'::jsonb,
  3,
  true
),
(
  'logos',
  'Trusted Partners',
  '{
    "heading": "Trusted by Leading Organizations",
    "logos": [
      {"name": "Department of Education", "url": ""},
      {"name": "Australian Curriculum", "url": ""},
      {"name": "Wellbeing Australia", "url": ""},
      {"name": "Mental Health Foundation", "url": ""}
    ]
  }'::jsonb,
  4,
  true
),
(
  'cta',
  'Call to Action',
  '{
    "eyebrow": "Join the Movement",
    "heading": "Ready to Make Student Wellbeing a Priority?",
    "description": "Join 1,200+ schools across Australia in the largest student wellbeing initiative. Register now for National Check-in Week 2026.",
    "primaryCTA": {"text": "Register Your School", "link": "/events"},
    "secondaryCTA": {"text": "Download Resources", "link": "/resources"},
    "backgroundColor": "#0B1D35",
    "textColor": "#FFFFFF"
  }'::jsonb,
  5,
  true
),
(
  'testimonials',
  'What Schools Say',
  '{
    "heading": "Hear from Participating Schools",
    "testimonials": [
      {
        "quote": "National Check-in Week transformed how we approach student wellbeing. The resources are invaluable.",
        "author": "Sarah Mitchell",
        "role": "Principal, Melbourne High School",
        "avatar": "https://i.pravatar.cc/150?img=1"
      },
      {
        "quote": "The data insights helped us identify at-risk students early and provide targeted support.",
        "author": "James Chen",
        "role": "Wellbeing Coordinator, Sydney Grammar",
        "avatar": "https://i.pravatar.cc/150?img=2"
      }
    ]
  }'::jsonb,
  6,
  true
)
ON CONFLICT DO NOTHING;
