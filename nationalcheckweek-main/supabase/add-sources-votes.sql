-- ═══════════════════════════════════════════════════════
--  Add site_sources + data_votes tables
--  Run once in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- ── SITE SOURCES (central public repository) ─────────
create table if not exists site_sources (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  url          text,
  publisher    text not null default '',
  year         text not null default '',
  category     text not null default 'general'
               check (category in ('mental-health','attendance','bullying','sleep','discrimination','policy','other','general')),
  entity_type  text not null default 'issue'
               check (entity_type in ('issue','area','state','homepage','general')),
  entity_slug  text not null default '',
  verified     boolean not null default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
alter table site_sources enable row level security;
do $$ begin
  create policy "Public read site_sources" on site_sources for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Auth write site_sources" on site_sources for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

-- ── DATA VOTES ────────────────────────────────────────
create table if not exists data_votes (
  id           uuid primary key default gen_random_uuid(),
  entity_type  text not null default 'issue',
  entity_slug  text not null,
  vote         text not null check (vote in ('up','down')),
  feedback     text,
  contact      text,
  ip_hash      text,
  created_at   timestamptz default now()
);
alter table data_votes enable row level security;
-- Anyone can insert a vote (anonymous)
do $$ begin
  create policy "Public insert data_votes" on data_votes for insert with check (true);
exception when duplicate_object then null; end $$;
-- Only authenticated (admin) can read votes
do $$ begin
  create policy "Auth read data_votes" on data_votes for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

-- Aggregate view — safe to query publicly (just counts, no personal data)
create or replace view data_vote_counts as
  select
    entity_type,
    entity_slug,
    count(*) filter (where vote = 'up')   as up_count,
    count(*) filter (where vote = 'down') as down_count,
    count(*) as total
  from data_votes
  group by entity_type, entity_slug;

-- Grant anon select on the view
grant select on data_vote_counts to anon;
