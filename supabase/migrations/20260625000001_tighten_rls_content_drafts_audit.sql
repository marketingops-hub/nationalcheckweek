-- ════════════════════════════════════════════════════════════════════════
-- Tighten RLS on content_drafts and audit_logs.
--
-- Why: both tables previously allowed ANY authenticated Supabase user to
-- read/write:
--   • content_drafts had `USING (auth.role() = 'authenticated')` on both
--     SELECT and ALL — so any logged-in user (e.g. a future public/newsletter
--     auth user) could read or modify every AI-generated draft.
--   • audit_logs had `WITH CHECK (true)` on INSERT — any authenticated user
--     could forge or flood the audit trail, defeating its forensic purpose.
--
-- Safe to apply: the application writes both tables exclusively through the
-- service-role client (adminClient()) behind requireAdmin-gated API routes.
-- The service role BYPASSES RLS, so these stricter policies do not affect the
-- legitimate write path — they only remove direct-token access for non-admins.
--
-- Roles permitted: editor, admin, super_admin for content_drafts (content
-- management is an editor capability); admin / super_admin only for audit_logs.
-- (Note: the user_profiles.role CHECK currently lists only user/admin/
--  super_admin — 'editor' is referenced by the app but not yet a valid DB
--  value. The policy is written forward-compatibly; it simply never matches
--  'editor' until that constraint is widened in a separate migration.)
-- ════════════════════════════════════════════════════════════════════════

-- ─── content_drafts ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Auth read content_drafts"  ON content_drafts;
DROP POLICY IF EXISTS "Auth write content_drafts" ON content_drafts;

CREATE POLICY "Staff read content_drafts"
  ON content_drafts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('editor', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Staff write content_drafts"
  ON content_drafts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('editor', 'admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('editor', 'admin', 'super_admin')
    )
  );

-- ─── audit_logs ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

CREATE POLICY "Admins can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );
