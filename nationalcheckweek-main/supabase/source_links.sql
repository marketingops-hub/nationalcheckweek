-- Run in Supabase SQL Editor
-- Links vault_sources to any entity (area, state, issue, content, etc.)

create table if not exists source_links (
  id            uuid primary key default gen_random_uuid(),
  source_id     uuid not null references vault_sources(id) on delete cascade,
  entity_type   text not null,                    -- 'area', 'state', 'issue', 'content', 'research_theme'
  entity_slug   text not null,                    -- e.g., 'melbourne', 'victoria', 'cyberbullying'
  relevance     text not null default 'primary',  -- 'primary', 'secondary', 'reference'
  notes         text not null default '',         -- Optional context about why this source is linked
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  
  unique (source_id, entity_type, entity_slug)    -- Prevent duplicate links
);

-- Index for fast lookups by entity
create index if not exists idx_source_links_entity on source_links(entity_type, entity_slug);
create index if not exists idx_source_links_source on source_links(source_id);

alter table source_links enable row level security;

-- Public read access
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'source_links' AND policyname = 'Public read source_links'
  ) THEN
    CREATE POLICY "Public read source_links"
      ON source_links FOR SELECT USING (true);
  END IF;
END $$;

-- Authenticated write access
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'source_links' AND policyname = 'Auth write source_links'
  ) THEN
    CREATE POLICY "Auth write source_links"
      ON source_links FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Updated timestamp trigger
DROP TRIGGER IF EXISTS source_links_updated_at ON source_links;
CREATE TRIGGER source_links_updated_at BEFORE UPDATE ON source_links
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Insert National Check-In Week sources into vault_sources
INSERT INTO vault_sources (url, title, description, category, is_approved, added_by)
VALUES 
  (
    'https://nationalcheckinweek.com/states/victoria',
    'National Check-In Week - Victoria',
    'State-level data and resources for Victoria youth mental health during National Check-In Week',
    'mental_health',
    true,
    'admin'
  ),
  (
    'https://nationalcheckinweek.com/areas/melbourne',
    'National Check-In Week - Melbourne',
    'Melbourne-specific data and resources for youth mental health during National Check-In Week',
    'mental_health',
    true,
    'admin'
  )
ON CONFLICT (url) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = now();

-- Link Victoria source to Victoria state
INSERT INTO source_links (source_id, entity_type, entity_slug, relevance, notes)
SELECT 
  id,
  'state',
  'victoria',
  'primary',
  'Primary state-level resource for Victoria youth mental health data'
FROM vault_sources 
WHERE url = 'https://nationalcheckinweek.com/states/victoria'
ON CONFLICT DO NOTHING;

-- Link Melbourne source to Melbourne area
INSERT INTO source_links (source_id, entity_type, entity_slug, relevance, notes)
SELECT 
  id,
  'area',
  'melbourne',
  'primary',
  'Primary area-level resource for Melbourne youth mental health data'
FROM vault_sources 
WHERE url = 'https://nationalcheckinweek.com/areas/melbourne'
ON CONFLICT DO NOTHING;

-- Create view for easy querying of sources by entity
CREATE OR REPLACE VIEW entity_sources AS
SELECT 
  sl.entity_type,
  sl.entity_slug,
  sl.relevance,
  sl.notes as link_notes,
  vs.id as source_id,
  vs.url,
  vs.title,
  vs.description,
  vs.domain,
  vs.category,
  vs.is_approved,
  sl.created_at as linked_at
FROM source_links sl
JOIN vault_sources vs ON sl.source_id = vs.id
WHERE vs.is_approved = true
ORDER BY sl.entity_type, sl.entity_slug, sl.relevance;

-- Grant access to view
GRANT SELECT ON entity_sources TO anon, authenticated;
