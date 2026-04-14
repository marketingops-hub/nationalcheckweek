-- ═══════════════════════════════════════════════════════════════════
-- AUSTRALIAN POSTCODES TABLE
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Safe to re-run (idempotent)
-- ═══════════════════════════════════════════════════════════════════

create table if not exists australian_postcodes (
  id                  integer primary key,
  postcode            text not null,
  locality            text not null,
  state               text,
  longitude           numeric,
  latitude            numeric,
  lat_precise         numeric,
  long_precise        numeric,
  type                text,
  status              text,
  sa3_code            text,
  sa3_name            text,
  sa4_code            text,
  sa4_name            text,
  sa2_code            text,
  sa2_name            text,
  sa1_code            text,
  region              text,
  ra_2021             text,
  ra_2021_name        text,
  lga_region          text,
  lga_code            text,
  phn_code            text,
  phn_name            text,
  electorate          text,
  created_at          timestamptz default now()
);

alter table australian_postcodes enable row level security;

do $$ begin
  create policy "Public read australian_postcodes"
    on australian_postcodes for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Service role write australian_postcodes"
    on australian_postcodes for all using (auth.role() = 'service_role');
exception when duplicate_object then null; end $$;

-- Indexes for the lookups we'll do
create index if not exists ap_postcode_idx  on australian_postcodes (postcode);
create index if not exists ap_state_idx     on australian_postcodes (state);
create index if not exists ap_sa3_name_idx  on australian_postcodes (sa3_name);
create index if not exists ap_locality_idx  on australian_postcodes (locality);

-- ── Add area_slug to school_profiles ─────────────────────────────
-- This is the FK-style link back to the areas table
alter table school_profiles
  add column if not exists area_slug text references areas(slug) on delete set null;

create index if not exists sp_area_slug_idx on school_profiles (area_slug);
