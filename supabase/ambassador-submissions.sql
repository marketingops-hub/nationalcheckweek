-- ═══════════════════════════════════════════════════════════════════
-- AMBASSADOR SUBMISSIONS: Applications + Nominations
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Safe to re-run (idempotent)
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Ambassador Applications ──────────────────────────────────
create table if not exists ambassador_applications (
  id              uuid primary key default gen_random_uuid(),
  first_name      text not null,
  last_name       text not null,
  email           text not null,
  phone           text,
  organisation    text,
  role_title      text,
  state           text,
  category_id     uuid references ambassador_categories(id) on delete set null,
  why_ambassador  text not null,
  experience      text,
  linkedin_url    text,
  website_url     text,
  status          text not null default 'new' check (status in ('new','reviewing','approved','declined')),
  admin_notes     text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table ambassador_applications enable row level security;

do $$ begin
  create policy "Public insert ambassador_applications"
    on ambassador_applications for insert with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Auth read ambassador_applications"
    on ambassador_applications for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Auth update ambassador_applications"
    on ambassador_applications for update using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Auth delete ambassador_applications"
    on ambassador_applications for delete using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger ambassador_applications_updated_at
    before update on ambassador_applications
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

create index if not exists ambassador_applications_status_idx on ambassador_applications(status);
create index if not exists ambassador_applications_created_idx on ambassador_applications(created_at desc);

-- ── 2. Ambassador Nominations ───────────────────────────────────
create table if not exists ambassador_nominations (
  id                  uuid primary key default gen_random_uuid(),
  -- Person being nominated
  nominee_first_name  text not null,
  nominee_last_name   text not null,
  nominee_email       text,
  nominee_phone       text,
  nominee_organisation text,
  nominee_role_title  text,
  nominee_state       text,
  category_id         uuid references ambassador_categories(id) on delete set null,
  reason              text not null,
  nominee_linkedin    text,
  -- Nominator details
  nominator_name      text not null,
  nominator_email     text not null,
  nominator_phone     text,
  nominator_relation  text,
  -- Admin
  status              text not null default 'new' check (status in ('new','reviewing','contacted','approved','declined')),
  admin_notes         text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table ambassador_nominations enable row level security;

do $$ begin
  create policy "Public insert ambassador_nominations"
    on ambassador_nominations for insert with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Auth read ambassador_nominations"
    on ambassador_nominations for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Auth update ambassador_nominations"
    on ambassador_nominations for update using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Auth delete ambassador_nominations"
    on ambassador_nominations for delete using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger ambassador_nominations_updated_at
    before update on ambassador_nominations
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

create index if not exists ambassador_nominations_status_idx on ambassador_nominations(status);
create index if not exists ambassador_nominations_created_idx on ambassador_nominations(created_at desc);

-- ── 3. Add Apply + Nominate to front-end menu ───────────────────
-- Only inserts if the href doesn't already exist in menu_items
insert into menu_items (label, href, target, position, is_active)
select 'Apply', '/ambassadors/apply', '_self',
  coalesce((select max(position) from menu_items), 0) + 1,
  true
where not exists (select 1 from menu_items where href = '/ambassadors/apply');

insert into menu_items (label, href, target, position, is_active)
select 'Nominate', '/ambassadors/nominate', '_self',
  coalesce((select max(position) from menu_items), 0) + 1,
  true
where not exists (select 1 from menu_items where href = '/ambassadors/nominate');

-- Fix any existing stale /apply and /nominate menu items
update menu_items set href = '/ambassadors/apply'   where href = '/apply';
update menu_items set href = '/ambassadors/nominate' where href = '/nominate';
