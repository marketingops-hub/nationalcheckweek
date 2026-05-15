-- ============================================================================
-- MINIMAL WORKING MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Create homepage_global_settings table
CREATE TABLE IF NOT EXISTS homepage_global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homepage_global_settings_key ON homepage_global_settings(setting_key);
ALTER TABLE homepage_global_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view global settings" ON homepage_global_settings;
CREATE POLICY "Public can view global settings" ON homepage_global_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage global settings" ON homepage_global_settings;
CREATE POLICY "Authenticated users can manage global settings" ON homepage_global_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Create trigger function
CREATE OR REPLACE FUNCTION update_homepage_global_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS homepage_global_settings_updated_at ON homepage_global_settings;
CREATE TRIGGER homepage_global_settings_updated_at BEFORE UPDATE ON homepage_global_settings FOR EACH ROW EXECUTE FUNCTION update_homepage_global_settings_updated_at();

-- 3. Insert default colors
INSERT INTO homepage_global_settings (setting_key, setting_value) 
VALUES ('global_colors', '{"primaryButton": "#29B8E8", "primaryButtonText": "#FFFFFF", "secondaryButton": "rgba(255,255,255,0.2)", "secondaryButtonText": "#FFFFFF", "heading": "#0f0e1a", "subheading": "#4a4768", "accentColor": "#29B8E8", "backgroundColor": "#FFFFFF", "textColor": "#1e1b33", "ctaBackground": "#0B1D35", "ctaText": "#FFFFFF", "ctaPrimaryButton": "#29B8E8", "borderColor": "#e4e2ec", "mutedText": "#7b78a0"}'::jsonb) 
ON CONFLICT (setting_key) DO NOTHING;

-- 4. Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage profiles" ON user_profiles;
CREATE POLICY "Admins can manage profiles" ON user_profiles FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- 5. Create user profile trigger
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_user_profiles_updated_at();

-- 6. Create admin check function
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND role IN ('admin', 'super_admin'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Make you super_admin
INSERT INTO user_profiles (id, email, role) 
SELECT id, email, 'super_admin' 
FROM auth.users 
WHERE email = 'gmachuret@gmail.com' 
ON CONFLICT (id) DO UPDATE SET role = 'super_admin';
