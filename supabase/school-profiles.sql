-- ═══════════════════════════════════════════════════════════════════
-- SCHOOL PROFILES TABLE
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Safe to re-run (idempotent)
-- ═══════════════════════════════════════════════════════════════════

create table if not exists school_profiles (
  id                                      uuid primary key default gen_random_uuid(),
  calendar_year                           integer,
  acara_sml_id                            integer unique,
  school_name                             text not null,
  suburb                                  text,
  state                                   text,
  postcode                                text,
  school_sector                           text,
  school_type                             text,
  school_url                              text,
  governing_body                          text,
  governing_body_url                      text,
  year_range                              text,
  geolocation                             text,
  icsea                                   integer,
  icsea_percentile                        integer,
  bottom_sea_quarter_pct                  numeric,
  lower_middle_sea_quarter_pct            numeric,
  upper_middle_sea_quarter_pct            numeric,
  top_sea_quarter_pct                     numeric,
  teaching_staff                          integer,
  fte_teaching_staff                      numeric,
  non_teaching_staff                      integer,
  fte_non_teaching_staff                  numeric,
  total_enrolments                        integer,
  girls_enrolments                        integer,
  boys_enrolments                         integer,
  fte_enrolments                          numeric,
  indigenous_enrolments_pct               numeric,
  lbote_yes_pct                           numeric,
  lbote_no_pct                            numeric,
  lbote_not_stated_pct                    numeric,
  created_at                              timestamptz default now()
);

alter table school_profiles enable row level security;

do $$ begin
  create policy "Public read school_profiles" on school_profiles for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Auth write school_profiles" on school_profiles for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

-- Indexes for common lookups
create index if not exists school_profiles_state_idx       on school_profiles (state);
create index if not exists school_profiles_suburb_idx      on school_profiles (suburb);
create index if not exists school_profiles_sector_idx      on school_profiles (school_sector);
create index if not exists school_profiles_acara_idx       on school_profiles (acara_sml_id);
create index if not exists school_profiles_name_idx        on school_profiles using gin (to_tsvector('english', school_name));
