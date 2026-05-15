-- Run in Supabase SQL Editor
-- Dedicated table for issue sources/citations (relational, not JSONB)

create table if not exists issue_sources (
  id          uuid primary key default gen_random_uuid(),
  issue_id    uuid not null references issues(id) on delete cascade,
  num         integer not null,                          -- citation number: 1, 2, 3…
  title       text not null default '',                  -- "AIHW Mental Health of Young People 2024"
  url         text not null default '',                  -- "https://aihw.gov.au/reports/..."
  publisher   text not null default '',                  -- "Australian Institute of Health and Welfare"
  year        text not null default '',                  -- "2024"
  accessed_at text not null default '',                  -- "March 2026"
  verified    boolean not null default false,            -- true if AI-verified or manually confirmed
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),

  unique (issue_id, num)                                 -- no duplicate citation numbers per issue
);

alter table issue_sources enable row level security;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'issue_sources' AND policyname = 'Public read issue_sources'
  ) THEN
    CREATE POLICY "Public read issue_sources"
      ON issue_sources FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'issue_sources' AND policyname = 'Auth write issue_sources'
  ) THEN
    CREATE POLICY "Auth write issue_sources"
      ON issue_sources FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

DROP TRIGGER IF EXISTS issue_sources_updated_at ON issue_sources;
CREATE TRIGGER issue_sources_updated_at BEFORE UPDATE ON issue_sources
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
