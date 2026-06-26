-- ════════════════════════════════════════════════════════════════════════
-- Widen user_profiles.role to allow 'editor'.
--
-- Why: the application (rbac.ts, proxy.ts, the user-creation API, and the
-- USER_ROLES whitelist) all reference an 'editor' role, but the original
-- CHECK constraint from migration 021 only permitted user/admin/super_admin.
-- As a result, creating an editor account wrote the auth user successfully
-- but the user_profiles upsert was silently rejected — leaving the account
-- with no valid role, so the middleware denied admin access entirely.
--
-- Safe to apply: this only ADDS 'editor' as a permitted value. Existing rows
-- (user/admin/super_admin) remain valid; no data is modified.
-- ════════════════════════════════════════════════════════════════════════

ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('user', 'editor', 'admin', 'super_admin'));
