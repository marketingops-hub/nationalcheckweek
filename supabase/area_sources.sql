-- Run in Supabase SQL Editor
-- Table for area/region data sources and citations

create table if not exists area_sources (
  id          uuid primary key default gen_random_uuid(),
  area_slug   text not null,                            -- matches slug in areas.json (e.g., 'melbourne', 'victoria')
  source_type text not null default 'web',              -- 'web', 'report', 'data', 'research'
  title       text not null default '',                  -- "National Check-In Week - Victoria"
  url         text not null default '',                  -- "https://nationalcheckinweek.com/states/victoria"
  publisher   text not null default '',                  -- "National Check-In Week"
  year        text not null default '',                  -- "2024"
  accessed_at text not null default '',                  -- "April 2026"
  description text not null default '',                  -- Brief description of what this source provides
  verified    boolean not null default false,            -- true if verified/validated
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Index for fast lookups by area
create index if not exists idx_area_sources_area_slug on area_sources(area_slug);

alter table area_sources enable row level security;

-- Public read access
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'area_sources' AND policyname = 'Public read area_sources'
  ) THEN
    CREATE POLICY "Public read area_sources"
      ON area_sources FOR SELECT USING (true);
  END IF;
END $$;

-- Authenticated write access
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'area_sources' AND policyname = 'Auth write area_sources'
  ) THEN
    CREATE POLICY "Auth write area_sources"
      ON area_sources FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Updated timestamp trigger
DROP TRIGGER IF EXISTS area_sources_updated_at ON area_sources;
CREATE TRIGGER area_sources_updated_at BEFORE UPDATE ON area_sources
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Insert the National Check-In Week sources
INSERT INTO area_sources (area_slug, source_type, title, url, publisher, year, accessed_at, description, verified)
VALUES 
  (
    'victoria',
    'web',
    'National Check-In Week - Victoria',
    'https://nationalcheckinweek.com/states/victoria',
    'National Check-In Week',
    '2024',
    'April 2026',
    'State-level data and resources for Victoria youth mental health during National Check-In Week',
    true
  ),
  (
    'melbourne',
    'web',
    'National Check-In Week - Melbourne',
    'https://nationalcheckinweek.com/areas/melbourne',
    'National Check-In Week',
    '2024',
    'April 2026',
    'Melbourne-specific data and resources for youth mental health during National Check-In Week',
    true
  )
ON CONFLICT DO NOTHING;
