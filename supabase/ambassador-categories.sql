-- ═══════════════════════════════════════════════════════════════════
-- AMBASSADOR CATEGORIES
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Safe to re-run (idempotent)
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Categories table ──────────────────────────────────────────
create table if not exists ambassador_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  description text not null default '',
  color       text not null default '#7c3aed',
  icon        text not null default 'diversity_3',
  sort_order  integer not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table ambassador_categories enable row level security;

do $$ begin
  create policy "Public read ambassador_categories" on ambassador_categories for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Auth write ambassador_categories" on ambassador_categories for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger ambassador_categories_updated_at before update on ambassador_categories
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- ── 2. Seed default categories ──────────────────────────────────
insert into ambassador_categories (name, slug, description, color, icon, sort_order) values
  ('School Executive', 'school-executive', 'Principals, deputy principals and school leadership', '#2563eb', 'school', 1),
  ('Teacher', 'teacher', 'Classroom teachers and educators', '#16a34a', 'cast_for_education', 2),
  ('Psychologist', 'psychologist', 'Psychologists and mental health professionals', '#7c3aed', 'psychology', 3),
  ('Industry Leader', 'industry-leader', 'Business and community leaders', '#d97706', 'business_center', 4),
  ('Celebrity', 'celebrity', 'Public figures and celebrities', '#db2777', 'star', 5),
  ('Researcher', 'researcher', 'Academics and research professionals', '#0891b2', 'science', 6)
on conflict (slug) do nothing;

-- ── 3. Add category_id to Ambassador table ───────────────────────
alter table "Ambassador" add column if not exists "categoryId" uuid references ambassador_categories(id) on delete set null;

create index if not exists ambassador_category_idx on "Ambassador" ("categoryId");
