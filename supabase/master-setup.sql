-- ═══════════════════════════════════════════════════════════════════
-- MASTER SETUP — Schools Wellbeing Australia
-- Run this ONCE in: Supabase Dashboard → SQL Editor → New Query
-- Safe to re-run (fully idempotent)
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. UPDATED_AT FUNCTION ──────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── 2. ISSUES ──────────────────────────────────────────────────────
create table if not exists issues (
  id            uuid primary key default gen_random_uuid(),
  rank          integer not null unique,
  slug          text    not null unique,
  icon          text    not null default '',
  severity      text    not null check (severity in ('critical','high','notable')),
  title         text    not null,
  anchor_stat   text    not null default '',
  short_desc    text    not null default '',
  definition    text    not null default '',
  australian_data text  not null default '',
  mechanisms    text    not null default '',
  impacts       jsonb   not null default '[]',
  groups        jsonb   not null default '[]',
  sources       jsonb   not null default '[]',
  updated_at    timestamptz default now()
);
alter table issues enable row level security;
do $$ begin
  create policy "Public read issues" on issues for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Auth write issues" on issues for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger issues_updated_at before update on issues
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- ── 3. STATES ──────────────────────────────────────────────────────
create table if not exists states (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null unique,
  icon        text not null default '',
  subtitle    text not null default '',
  issues      jsonb not null default '[]',
  updated_at  timestamptz default now()
);
alter table states enable row level security;
do $$ begin
  create policy "Public read states" on states for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Auth write states" on states for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger states_updated_at before update on states
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- ── 4. AREAS ───────────────────────────────────────────────────────
create table if not exists areas (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  state       text not null,
  state_slug  text not null,
  type        text not null check (type in ('city','region','lga')),
  population  text not null default '',
  schools     text not null default '',
  overview    text not null default '',
  key_stats   jsonb not null default '[]',
  issues      jsonb not null default '[]',
  prevention  text not null default '',
  updated_at  timestamptz default now()
);
alter table areas enable row level security;
do $$ begin
  create policy "Public read areas" on areas for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Auth write areas" on areas for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger areas_updated_at before update on areas
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- ── 5. REDIRECTS ───────────────────────────────────────────────────
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
  create policy "Public read redirects" on redirects for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Auth write redirects" on redirects for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger redirects_updated_at before update on redirects
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- ── 6. API KEYS ────────────────────────────────────────────────────
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
do $$ begin
  create trigger api_keys_updated_at before update on api_keys
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- ── 7. VAULT SOURCES ───────────────────────────────────────────────
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

-- ── 8. CMS PAGES ───────────────────────────────────────────────────
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
  og_image     text not null default '',
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

-- ── 9. MENU ITEMS ──────────────────────────────────────────────────
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

insert into menu_items (label, href, position, is_active) values
  ('Map',        '/#map',        1, true),
  ('Issues',     '/#issues',     2, true),
  ('Prevention', '/#prevention', 3, true),
  ('Research',   '/#research',   4, true),
  ('Data',       '/#data',       5, true)
on conflict do nothing;

-- ── 10. GENERATION LOG ─────────────────────────────────────────────
create table if not exists generation_log (
  id           uuid primary key default gen_random_uuid(),
  page_type    text not null,
  record_id    uuid not null,
  section_keys jsonb not null default '[]',
  model        text not null default 'gpt-4o',
  tokens_used  integer not null default 0,
  status       text not null default 'success' check (status in ('success','error')),
  error_msg    text not null default '',
  created_at   timestamptz default now()
);
alter table generation_log enable row level security;
do $$ begin
  create policy "Auth read generation_log" on generation_log for select using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Auth write generation_log" on generation_log for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

-- ── 11. PROMPT TEMPLATES ───────────────────────────────────────────
create table if not exists prompt_templates (
  id           uuid primary key default gen_random_uuid(),
  page_type    text not null check (page_type in ('state', 'area')),
  section_key  text not null,
  label        text not null,
  prompt       text not null,
  model        text not null default 'gpt-4o',
  updated_at   timestamptz default now(),
  constraint prompt_templates_unique unique (page_type, section_key)
);
alter table prompt_templates enable row level security;
do $$ begin
  create policy "Public read prompt_templates" on prompt_templates for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Auth write prompt_templates" on prompt_templates for all using (auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger prompt_templates_updated_at before update on prompt_templates
    for each row execute function set_updated_at();
exception when duplicate_object then null; end $$;

-- Seed prompt templates
insert into prompt_templates (page_type, section_key, label, prompt, model) values

('state', 'subtitle', 'State — Subtitle',
$$You are writing a short subtitle for an Australian state wellbeing data page.
State: {{state_name}}
Write a single sentence (max 18 words) that describes the key student wellbeing challenges facing {{state_name}} schools. It should be factual, specific to the state, and suitable for a public-facing data website. Return plain text only — no quotes, no markdown.$$,
'gpt-4o'),

('state', 'issues', 'State — Priority Issues (JSON)',
$$You are a student wellbeing data analyst writing content for an Australian education data website.
State: {{state_name}}
Using approved Australian data sources only, identify the 3–5 most significant student wellbeing challenges in {{state_name}} schools.
Return a JSON array with this exact structure — no markdown, no prose, just raw JSON:
[{"name":"Issue name","badge":"badge-critical"|"badge-high"|"badge-notable","stat":"A specific Australian statistic","desc":"2–3 sentences describing this issue in {{state_name}} with reference to state-level data."}]
Badge severity: badge-critical = affects >25% or risk-to-life; badge-high = 10–25%; badge-notable = emerging.
Cite only real, verifiable Australian data.$$,
'gpt-4o'),

('state', 'seo_title', 'State — SEO Title',
$$Write an SEO title tag for an Australian student wellbeing data page about {{state_name}}. Max 60 characters. Include "{{state_name}}" and a relevant keyword. No brand name. Return plain text only.$$,
'gpt-4o'),

('state', 'seo_desc', 'State — SEO Meta Description',
$$Write an SEO meta description for an Australian student wellbeing data page about {{state_name}}. 140–155 characters. Mention {{state_name}}, student wellbeing, and a specific issue if possible. Return plain text only.$$,
'gpt-4o'),

('area', 'overview', 'City/Area — Overview',
$$You are writing a hero overview paragraph for an Australian city/area student wellbeing page.
City/Area: {{city_name}}, State: {{state_name}}
Write 2–3 sentences (max 60 words) describing the student wellbeing landscape in {{city_name}}, {{state_name}}. Return plain text only.$$,
'gpt-4o'),

('area', 'issues', 'City/Area — Priority Issues (JSON)',
$$You are a student wellbeing data analyst. City/Area: {{city_name}}, State: {{state_name}}
Identify the 3–5 most significant student wellbeing issues in {{city_name}}.
Return raw JSON only: [{"title":"Issue","severity":"critical"|"high"|"notable","stat":"statistic","desc":"2–3 sentences"}]$$,
'gpt-4o'),

('area', 'prevention', 'City/Area — Prevention Insight',
$$Write a Prevention Insight callout for {{city_name}}, {{state_name}}. 2–4 sentences (max 80 words) on how early data-led measurement can prevent crises in local schools. Authoritative but accessible tone. Return plain text only.$$,
'gpt-4o'),

('area', 'key_stats', 'City/Area — Key Stats (JSON)',
$$Write key statistics for a student wellbeing page about {{city_name}}, {{state_name}}.
Return raw JSON only: [{"num":"e.g. 1 in 5","label":"students experience anxiety"}]
Use only real, verifiable Australian data.$$,
'gpt-4o'),

('area', 'seo_title', 'City/Area — SEO Title',
$$Write an SEO title tag for {{city_name}}, {{state_name}} student wellbeing page. Max 60 characters. Include city name and a relevant keyword. Return plain text only.$$,
'gpt-4o'),

('area', 'seo_desc', 'City/Area — SEO Meta Description',
$$Write an SEO meta description for {{city_name}}, {{state_name}} student wellbeing page. 140–155 characters. Mention city, state, and student wellbeing. Return plain text only.$$,
'gpt-4o')

on conflict (page_type, section_key) do nothing;

-- ── 12. SEO COLUMNS ────────────────────────────────────────────────
alter table issues add column if not exists seo_title text not null default '';
alter table issues add column if not exists seo_desc  text not null default '';
alter table issues add column if not exists og_image  text not null default '';

alter table states add column if not exists seo_title text not null default '';
alter table states add column if not exists seo_desc  text not null default '';
alter table states add column if not exists og_image  text not null default '';

alter table areas  add column if not exists seo_title text not null default '';
alter table areas  add column if not exists seo_desc  text not null default '';
alter table areas  add column if not exists og_image  text not null default '';
