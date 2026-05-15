-- ── Redirects table ─────────────────────────────────────────────
-- Safe to re-run

create table if not exists redirects (
  id          uuid primary key default gen_random_uuid(),
  from_path   text not null unique,
  to_path     text not null,
  status_code smallint not null default 301,
  is_active   boolean not null default true,
  note        text not null default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table redirects enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'redirects' and policyname = 'Auth read redirects'
  ) then
    create policy "Auth read redirects" on redirects for select using (auth.role() = 'authenticated');
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'redirects' and policyname = 'Auth write redirects'
  ) then
    create policy "Auth write redirects" on redirects for all using (auth.role() = 'authenticated');
  end if;
  -- Public read for middleware (needs anon to look up redirects)
  if not exists (
    select 1 from pg_policies where tablename = 'redirects' and policyname = 'Public read redirects'
  ) then
    create policy "Public read redirects" on redirects for select using (true);
  end if;
end $$;

create or replace function update_redirects_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists redirects_updated_at on redirects;
create trigger redirects_updated_at
  before update on redirects
  for each row execute function update_redirects_updated_at();
