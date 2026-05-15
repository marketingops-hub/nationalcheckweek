-- Auto-update updated_at on pages table
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pages_set_updated_at ON public.pages;
CREATE TRIGGER pages_set_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Tighten RLS: only service_role can write (all admin writes go via adminClient)
DROP POLICY IF EXISTS "pages_admin_all"    ON public.pages;
DROP POLICY IF EXISTS "pages_public_read"  ON public.pages;

CREATE POLICY "pages_public_read" ON public.pages
  FOR SELECT USING (status = 'published');

CREATE POLICY "pages_service_write" ON public.pages
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
