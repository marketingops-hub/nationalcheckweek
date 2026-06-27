-- API keys store backing the admin "API Management" page (/admin/api).
-- Previously this lived only in supabase/api_keys.sql as a manual script, so
-- environments where it was never run have no api_keys table and the page
-- errors with "relation \"api_keys\" does not exist". This migration makes
-- the table part of the schema. Fully idempotent — safe to re-run.

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

-- Reads/writes from the app go through the service-role client (bypasses
-- RLS); these policies cover any authenticated direct access.
drop policy if exists "Auth read api_keys"  on api_keys;
drop policy if exists "Auth write api_keys" on api_keys;
create policy "Auth read api_keys"  on api_keys for select using (auth.role() = 'authenticated');
create policy "Auth write api_keys" on api_keys for all    using (auth.role() = 'authenticated');

-- Shared updated_at trigger function — define if it isn't already present so
-- this migration can't fail on a fresh database.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists api_keys_updated_at on api_keys;
create trigger api_keys_updated_at before update on api_keys
  for each row execute function set_updated_at();
