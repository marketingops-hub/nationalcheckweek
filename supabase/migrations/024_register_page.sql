-- Create register_page table for CMS-managed registration page content

CREATE TABLE IF NOT EXISTS register_page (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  heading TEXT NOT NULL,
  subheading TEXT,
  description TEXT,
  right_column_content JSONB DEFAULT '[]'::jsonb,
  hubspot_form_id TEXT,
  hubspot_portal_id TEXT,
  seo_title TEXT,
  seo_description TEXT,
  background_color TEXT DEFAULT '#ffffff',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE register_page ENABLE ROW LEVEL SECURITY;

-- Public can view
DROP POLICY IF EXISTS "Public can view register page" ON register_page;
CREATE POLICY "Public can view register page"
  ON register_page
  FOR SELECT
  TO public
  USING (true);

-- Only authenticated users can modify
DROP POLICY IF EXISTS "Authenticated users can update register page" ON register_page;
CREATE POLICY "Authenticated users can update register page"
  ON register_page
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default content
INSERT INTO register_page (
  heading,
  subheading,
  description,
  right_column_content,
  hubspot_form_id,
  hubspot_portal_id,
  seo_title,
  seo_description
) VALUES (
  'Register for National Check-In Week 2026',
  'Join leading educators, psychologists, and experts',
  'Complete the form to register your school and gain access to free webinars, professional development sessions, and exclusive resources.',
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
  ]'::jsonb,
  '',
  '',
  'Register - National Check-In Week 2026',
  'Register your school for National Check-In Week 2026 and access free webinars, resources, and expert insights on student wellbeing.'
)
ON CONFLICT DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_register_page_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_register_page_updated_at ON register_page;
CREATE TRIGGER update_register_page_updated_at
  BEFORE UPDATE ON register_page
  FOR EACH ROW
  EXECUTE FUNCTION update_register_page_updated_at();
