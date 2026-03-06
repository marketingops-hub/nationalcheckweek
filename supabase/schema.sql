-- ============================================================
-- Schools Wellbeing Australia — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── ISSUES ───────────────────────────────────────────────────
-- Maps to src/lib/issues.ts → Issue interface
create table if not exists issues (
  id          uuid primary key default gen_random_uuid(),
  rank        integer not null unique,
  slug        text    not null unique,
  icon        text    not null default '',
  severity    text    not null check (severity in ('critical','high','notable')),
  title       text    not null,
  anchor_stat text    not null default '',
  short_desc  text    not null default '',
  definition  text    not null default '',
  australian_data text not null default '',
  mechanisms  text    not null default '',
  impacts     jsonb   not null default '[]',  -- [{title, text}]
  groups      jsonb   not null default '[]',  -- string[]
  sources     jsonb   not null default '[]',  -- string[]
  updated_at  timestamptz default now()
);

-- ── STATES ───────────────────────────────────────────────────
-- Maps to src/lib/regional.ts → RegionalMap / RegionalData
create table if not exists states (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null unique,
  icon        text not null default '',
  subtitle    text not null default '',
  -- Array of {name, badge, stat, desc}
  issues      jsonb not null default '[]',
  updated_at  timestamptz default now()
);

-- ── AREAS ────────────────────────────────────────────────────
-- Maps to src/lib/areas.ts → Area interface
create table if not exists areas (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  state       text not null,
  state_slug  text not null references states(slug),
  type        text not null check (type in ('city','region','lga')),
  population  text not null default '',
  schools     text not null default '',
  overview    text not null default '',
  key_stats   jsonb not null default '[]',  -- [{num, label}]
  issues      jsonb not null default '[]',  -- [{title, severity, stat, desc}]
  prevention  text not null default '',
  updated_at  timestamptz default now()
);

-- ── RLS (Row Level Security) ──────────────────────────────────
-- Public can read all three tables
alter table issues enable row level security;
alter table states enable row level security;
alter table areas  enable row level security;

create policy "Public read issues" on issues for select using (true);
create policy "Public read states" on states for select using (true);
create policy "Public read areas"  on areas  for select using (true);

-- Only authenticated users (admins) can write
create policy "Auth write issues" on issues for all using (auth.role() = 'authenticated');
create policy "Auth write states" on states for all using (auth.role() = 'authenticated');
create policy "Auth write areas"  on areas  for all using (auth.role() = 'authenticated');

-- ── UPDATED_AT TRIGGER ────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger issues_updated_at before update on issues for each row execute function set_updated_at();
create trigger states_updated_at before update on states for each row execute function set_updated_at();
create trigger areas_updated_at  before update on areas  for each row execute function set_updated_at();
