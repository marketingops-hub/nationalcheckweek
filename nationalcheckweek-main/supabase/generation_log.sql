-- ============================================================
-- Generation Log — audit trail for AI content re-generation runs
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

create table if not exists generation_log (
  id           uuid primary key default gen_random_uuid(),
  page_type    text not null check (page_type in ('state', 'area')),
  record_id    uuid not null,
  record_name  text not null default '',
  section_key  text not null,
  status       text not null check (status in ('success', 'error')),
  output       text,
  error        text,
  created_at   timestamptz default now()
);

alter table generation_log enable row level security;
create policy "Auth read generation_log"   on generation_log for select using (auth.role() = 'authenticated');
create policy "Auth insert generation_log" on generation_log for insert with check (auth.role() = 'authenticated');
