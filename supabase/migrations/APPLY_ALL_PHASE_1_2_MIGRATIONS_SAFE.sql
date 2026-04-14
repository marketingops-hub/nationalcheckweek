-- ============================================================================
-- COMBINED MIGRATIONS FOR PHASE 1 & 2 + SECURITY (SAFE VERSION)
-- Handles existing objects gracefully - safe to re-run
-- ============================================================================
-- 
-- IMPORTANT: Update line 178 with your actual email address!
-- Search for: 'your-email@example.com' and replace it
--
-- ============================================================================

-- ============================================================================
-- MIGRATION 019: Homepage Global Settings
-- ============================================================================

-- Homepage Global Settings Table
CREATE TABLE IF NOT EXISTS homepage_global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_homepage_global_settings_key ON homepage_global_settings(setting_key);

-- Enable Row Level Security
ALTER TABLE homepage_global_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Public can view global settings" ON homepage_global_settings;
CREATE POLICY "Public can view global settings"
  ON homepage_global_settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage global settings" ON homepage_global_settings;
CREATE POLICY "Authenticated users can manage global settings"
  ON homepage_global_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_homepage_global_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS homepage_global_settings_updated_at ON homepage_global_settings;
CREATE TRIGGER homepage_global_settings_updated_at
  BEFORE UPDATE ON homepage_global_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_homepage_global_settings_updated_at();

-- Insert default global color settings
INSERT INTO homepage_global_settings (setting_key, setting_value) VALUES
(
  'global_colors',
  '{
    "primaryButton": "#29B8E8",
    "primaryButtonText": "#FFFFFF",
    "secondaryButton": "rgba(255,255,255,0.2)",
    "secondaryButtonText": "#FFFFFF",
    "heading": "#0f0e1a",
    "subheading": "#4a4768",
    "accentColor": "#29B8E8",
    "backgroundColor": "#FFFFFF",
    "textColor": "#1e1b33",
    "ctaBackground": "#0B1D35",
    "ctaText": "#FFFFFF",
    "ctaPrimaryButton": "#29B8E8",
    "borderColor": "#e4e2ec",
    "mutedText": "#7b78a0"
  }'::jsonb
)
ON CONFLICT (setting_key) DO NOTHING;

-- Add comment
COMMENT ON TABLE homepage_global_settings IS 'Global theme settings for homepage blocks including color scheme, typography, and other shared settings';

-- ============================================================================
-- MIGRATION 020: Block Color Overrides Documentation
-- ============================================================================

-- Update table comment to document new color override feature
COMMENT ON TABLE homepage_blocks IS 'Homepage content blocks with support for global or custom colors. Each block can set "useGlobalColors": true/false in content.colors object. When false, block uses content.colors.{colorName} values instead of global settings.';

-- ============================================================================
-- MIGRATION 021: Admin Roles and Audit Logging
-- ============================================================================

-- 1. Add user_profiles table for role management
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast role lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage profiles" ON user_profiles;
CREATE POLICY "Admins can manage profiles"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- 2. Add audit_logs table for tracking changes
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- 3. Auto-update timestamp trigger for user_profiles
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- 4. Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = user_id AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to log audit events
CREATE OR REPLACE FUNCTION log_audit(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id TEXT,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_audit_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Get user email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    user_id,
    user_email,
    action,
    table_name,
    record_id,
    old_value,
    new_value
  ) VALUES (
    v_user_id,
    v_user_email,
    p_action,
    p_table_name,
    p_record_id,
    p_old_value,
    p_new_value
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. ⚠️ IMPORTANT: Insert your admin user
-- ⚠️ REPLACE 'your-email@example.com' WITH YOUR ACTUAL EMAIL ADDRESS!
INSERT INTO user_profiles (id, email, role)
SELECT 
  id,
  email,
  'super_admin'
FROM auth.users
WHERE email = 'your-email@example.com' -- ⚠️ CHANGE THIS TO YOUR EMAIL!
ON CONFLICT (id) DO UPDATE SET role = 'super_admin';

-- Add comments
COMMENT ON TABLE user_profiles IS 'User profiles with role-based access control';
COMMENT ON TABLE audit_logs IS 'Audit trail for all admin actions';
COMMENT ON FUNCTION is_admin IS 'Check if user has admin or super_admin role';
COMMENT ON FUNCTION log_audit IS 'Log an audit event with user context';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- 
-- ✅ What was created:
-- 1. homepage_global_settings table - Global color scheme
-- 2. user_profiles table - Admin role management
-- 3. audit_logs table - Complete audit trail
-- 4. Helper functions - is_admin(), log_audit()
-- 5. RLS policies - Secure access control
-- 6. Default color settings - Ready to use
--
-- ⚠️ NEXT STEPS:
-- 1. Verify your email was set correctly in line 278
-- 2. Check that you can access /admin/homepage-builder
-- 3. Go to Global Colors tab and customize your colors
-- 4. All changes will be logged in audit_logs table
--
-- ============================================================================
