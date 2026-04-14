-- Create pages table for the block-based PageEditor CMS
CREATE TABLE IF NOT EXISTS public.pages (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text        NOT NULL UNIQUE,
  title        text        NOT NULL,
  description  text        NOT NULL DEFAULT '',
  content      jsonb       NOT NULL DEFAULT '[]',
  status       text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  show_in_menu boolean     NOT NULL DEFAULT false,
  meta_title   text        NOT NULL DEFAULT '',
  meta_desc    text        NOT NULL DEFAULT '',
  og_image     text        NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pages_slug   ON public.pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON public.pages(status);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pages_public_read" ON public.pages FOR SELECT
  USING (status = 'published');

CREATE POLICY "pages_admin_all"   ON public.pages FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
