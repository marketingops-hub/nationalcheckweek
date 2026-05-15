-- ═══════════════════════════════════════════════════════
--  Events + Speakers tables
--  Run once in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

create table if not exists events (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null default '',
  tagline       text not null default '',
  description   text not null default '',           -- rich text / markdown
  body          text not null default '',           -- long body content
  event_date    date,
  event_time    text not null default '',           -- e.g. "10:00 AM AEST"
  event_end     text not null default '',           -- e.g. "11:30 AM AEST"
  format        text not null default 'webinar'
                check (format in ('webinar','in-person','hybrid','workshop','conference')),
  location      text not null default '',           -- URL for webinar or address for in-person
  feature_image text not null default '',
  capacity      integer,
  is_free       boolean not null default true,
  price         text not null default '',           -- e.g. "Free" or "$99"
  register_url  text not null default '',
  recording_url text not null default '',           -- if past event
  status        text not null default 'upcoming'
                check (status in ('draft','upcoming','live','past','cancelled')),
  published     boolean not null default false,
  seo_title     text not null default '',
  seo_desc      text not null default '',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table if not exists event_speakers (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  name        text not null default '',
  title       text not null default '',
  bio         text not null default '',
  photo       text not null default '',
  sort_order  integer not null default 0,
  created_at  timestamptz default now()
);

alter table events enable row level security;
alter table event_speakers enable row level security;

-- Public can read published events
do $$ begin
  create policy "Public read events" on events
    for select using (published = true);
exception when duplicate_object then null; end $$;

-- Auth can do everything
do $$ begin
  create policy "Auth all events" on events
    for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public read event_speakers" on event_speakers
    for select using (
      exists (select 1 from events e where e.id = event_id and e.published = true)
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Auth all event_speakers" on event_speakers
    for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

-- updated_at trigger
drop trigger if exists events_updated_at on events;
create trigger events_updated_at before update on events
  for each row execute function set_updated_at();
