-- Run in Supabase SQL Editor
-- Table for manually curated content blocks (verified facts, statistics, quotes)

create table if not exists vault_content (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default '',
  content     text not null default '',
  source      text not null default '',
  category    text not null default 'general',
  is_approved boolean not null default true,
  added_by    text not null default 'admin',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table vault_content enable row level security;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vault_content' AND policyname = 'Public read vault_content'
  ) THEN
    CREATE POLICY "Public read vault_content"
      ON vault_content FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'vault_content' AND policyname = 'Auth write vault_content'
  ) THEN
    CREATE POLICY "Auth write vault_content"
      ON vault_content FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

DROP TRIGGER IF EXISTS vault_content_updated_at ON vault_content;
CREATE TRIGGER vault_content_updated_at BEFORE UPDATE ON vault_content
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
