-- Run in Supabase SQL Editor
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

create policy "Public read vault_sources"
  on vault_sources for select using (true);

create policy "Auth write vault_sources"
  on vault_sources for all using (auth.role() = 'authenticated');

create trigger vault_sources_updated_at before update on vault_sources
  for each row execute function set_updated_at();
