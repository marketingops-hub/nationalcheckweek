-- ═══════════════════════════════════════════════════════
-- FULL MIGRATION — safe to re-run (idempotent)
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- ── API KEYS ────────────────────────────────────────────
create table if not exists api_keys (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  provider   text not null default 'openai',
  key_value  text not null,
  is_active  boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table api_keys enable row level security;
do $$ begin
  create policy "Auth read api_keys" on api_keys for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Auth write api_keys" on api_keys for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

-- ── VAULT SOURCES ───────────────────────────────────────
create table if not exists vault_sources (
  id           uuid primary key default gen_random_uuid(),
  url          text not null unique,
  title        text not null default '',
  description  text not null default '',
  domain       text generated always as (
    regexp_replace(url, '^https?://(www\.)?([^/]+).*$', '\2')
  ) stored,
  category     text not null default 'general',
  is_approved  boolean not null default true,
  added_by     text not null default 'admin',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
alter table vault_sources enable row level security;
do $$ begin
  create policy "Public read vault_sources" on vault_sources for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Auth write vault_sources" on vault_sources for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger vault_sources_updated_at before update on vault_sources
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- ── CMS PAGES ───────────────────────────────────────────
create table if not exists pages (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  description  text not null default '',
  content      jsonb not null default '[]',
  status       text not null default 'draft' check (status in ('draft','published')),
  show_in_menu boolean not null default false,
  meta_title   text not null default '',
  meta_desc    text not null default '',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
alter table pages enable row level security;
do $$ begin
  create policy "Public read published pages" on pages for select
    using (status = 'published' or auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Auth write pages" on pages for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger pages_updated_at before update on pages
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- ── MENU ITEMS ──────────────────────────────────────────
create table if not exists menu_items (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  href       text not null default '',
  page_id    uuid references pages(id) on delete set null,
  parent_id  uuid references menu_items(id) on delete cascade,
  position   integer not null default 0,
  target     text not null default '_self' check (target in ('_self','_blank')),
  is_active  boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table menu_items enable row level security;
do $$ begin
  create policy "Public read active menu" on menu_items for select
    using (is_active = true or auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Auth write menu" on menu_items for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger menu_items_updated_at before update on menu_items
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- ── DEFAULT MENU ITEMS ──────────────────────────────────
insert into menu_items (label, href, position, is_active) values
  ('Map',        '/#map',        1, true),
  ('Issues',     '/#issues',     2, true),
  ('Prevention', '/#prevention', 3, true),
  ('Research',   '/#research',   4, true),
  ('Data',       '/#data',       5, true)
on conflict do nothing;
