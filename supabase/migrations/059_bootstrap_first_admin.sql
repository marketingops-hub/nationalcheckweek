-- Bootstrap first admin user
-- If no admin/super_admin exists in user_profiles yet, promote all existing
-- auth.users to super_admin so the first real user can log in.
-- Safe to run multiple times (ON CONFLICT DO NOTHING / guarded by EXISTS check).

DO $$
BEGIN
  -- Only act if there are currently zero admins
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE role IN ('admin', 'super_admin')
  ) THEN
    INSERT INTO user_profiles (id, email, role)
    SELECT id, email, 'super_admin'
    FROM auth.users
    ON CONFLICT (id) DO UPDATE SET role = 'super_admin';
  END IF;
END;
$$;
