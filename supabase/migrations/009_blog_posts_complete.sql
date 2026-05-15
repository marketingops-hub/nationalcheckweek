-- Complete blog_posts table setup with RLS policies
-- This ensures the table exists and has proper security

-- Create blog_posts table if it doesn't exist
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  feature_image TEXT,
  author TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_desc TEXT,
  og_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);

-- Enable Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to published posts
CREATE POLICY "Public can view published blog posts"
  ON blog_posts
  FOR SELECT
  USING (published = true);

-- Policy: Allow authenticated users to view all posts (for admin)
CREATE POLICY "Authenticated users can view all blog posts"
  ON blog_posts
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert posts
CREATE POLICY "Authenticated users can create blog posts"
  ON blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to update posts
CREATE POLICY "Authenticated users can update blog posts"
  ON blog_posts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to delete posts
CREATE POLICY "Authenticated users can delete blog posts"
  ON blog_posts
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts;
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

-- Insert sample blog post for testing
INSERT INTO blog_posts (
  title,
  slug,
  excerpt,
  content,
  author,
  published,
  published_at,
  meta_title,
  meta_desc
) VALUES (
  'Welcome to National Check-in Week 2026',
  'welcome-to-nciw-2026',
  'Join us for Australia''s largest student wellbeing initiative, bringing together schools, experts, and communities.',
  '<h2>A National Priority</h2><p>Student wellbeing has never been more important. National Check-in Week 2026 brings together over 1,200 schools across Australia to prioritize mental health and wellbeing.</p><h3>What to Expect</h3><ul><li>Free webinars from leading experts</li><li>Interactive workshops</li><li>Data-driven insights</li><li>Community support</li></ul><p>Register your school today and be part of the movement.</p>',
  'NCIW Team',
  true,
  NOW(),
  'Welcome to National Check-in Week 2026 | Student Wellbeing',
  'Join Australia''s largest student wellbeing initiative. Free webinars, expert panels, and resources for schools.'
) ON CONFLICT (slug) DO NOTHING;
