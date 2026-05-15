-- Run in Supabase SQL Editor
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

create policy "Auth read api_keys"  on api_keys for select using (auth.role() = 'authenticated');
create policy "Auth write api_keys" on api_keys for all    using (auth.role() = 'authenticated');

create trigger api_keys_updated_at before update on api_keys
  for each row execute function set_updated_at();
