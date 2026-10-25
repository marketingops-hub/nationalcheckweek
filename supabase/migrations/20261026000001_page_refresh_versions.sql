-- Vault refresh: page versions + per-page sources.
--
-- "Refresh from vault" regenerates a page's data-driven fields from vault
-- documents, staff review the diff, then publish. Every publish (and every
-- revert) is a new row in page_versions, so any earlier version can be
-- restored. The vault documents a page was written from are kept in
-- page_sources and shown as links at the bottom of the public page.
--
-- Entities:
--   area         entity_key = areas.slug                     (overview, prevention, key_stats)
--   state_issue  entity_key = '<states.slug>/<issues.slug>'  (the state's stat + desc for that issue,
--                                                             stored in states.issues[])
--
-- Idempotent.

/* ── page_versions: append-only history ──────────────────────────────────── */

create table if not exists page_versions (
  id               uuid primary key default gen_random_uuid(),
  entity_type      text not null check (entity_type in ('area', 'state_issue')),
  entity_key       text not null,
  version          int  not null,
  -- Full snapshot of the refreshable fields AFTER this version was applied.
  content          jsonb not null,
  -- [{vault_document_id, sort_order}] live for this version.
  sources          jsonb not null default '[]'::jsonb,
  origin           text not null check (origin in ('baseline', 'refresh', 'revert')),
  note             text,
  reverted_from    uuid references page_versions(id) on delete set null,
  created_by       uuid,
  created_by_email text,
  created_at       timestamptz not null default now(),
  unique (entity_type, entity_key, version)
);

create index if not exists page_versions_entity_idx
  on page_versions (entity_type, entity_key, version desc);

-- Staff reach this table only through the admin API (service role).
alter table page_versions enable row level security;

/* ── page_sources: vault documents shown in the page footer ──────────────── */

create table if not exists page_sources (
  entity_type       text not null check (entity_type in ('area', 'state_issue')),
  entity_key        text not null,
  vault_document_id uuid not null references vault_documents(id) on delete cascade,
  sort_order        int  not null default 0,
  primary key (entity_type, entity_key, vault_document_id)
);

alter table page_sources enable row level security;

-- Public pages read sources through this function only: it exposes just the
-- citation fields (never the document text) and only http(s) links, and it
-- resolves labels/links live, so adding a public link to a vault document
-- later updates every page that cites it.
create or replace function get_page_sources(p_entity_type text, p_entity_key text)
returns table (
  document_id uuid,
  title       text,
  reference   text,
  author      text,
  publisher   text,
  year        text,
  page_ref    text,
  source_url  text,
  sort_order  int
)
language sql stable security definer set search_path = public
as $$
  select d.id,
         d.title,
         d.reference,
         d.author,
         d.publisher,
         d.year::text,
         d.page_ref,
         case when d.source_url ~* '^https?://' then d.source_url else null end,
         s.sort_order
  from page_sources s
  join vault_documents d on d.id = s.vault_document_id
  where s.entity_type = p_entity_type
    and s.entity_key  = p_entity_key
  order by s.sort_order, d.title;
$$;

/* ── live content of a page (the refreshable fields) ─────────────────────── */

create or replace function page_live_content(p_entity_type text, p_entity_key text)
returns jsonb
language plpgsql stable
as $$
declare
  v       jsonb;
  v_state text;
  v_issue text;
begin
  if p_entity_type = 'area' then
    select jsonb_build_object(
             'overview',   overview,
             'prevention', prevention,
             'key_stats',  key_stats)
      into v
      from areas
     where slug = p_entity_key;

  elsif p_entity_type = 'state_issue' then
    v_state := split_part(p_entity_key, '/', 1);
    v_issue := split_part(p_entity_key, '/', 2);
    select jsonb_build_object(
             'stat', coalesce(e.item->>'stat', ''),
             'desc', coalesce(e.item->>'desc', ''))
      into v
      from states s
      join issues i on i.slug = v_issue
      cross join lateral jsonb_array_elements(s.issues) with ordinality as e(item, ord)
     where s.slug = v_state
       and lower(e.item->>'name') = lower(i.title)
     limit 1;

  else
    raise exception 'unknown entity type: %', p_entity_type;
  end if;

  if v is null then
    raise exception 'page not found: % %', p_entity_type, p_entity_key
      using errcode = 'P0002';
  end if;
  return v;
end;
$$;

/* ── apply_page_version: publish or revert, atomically ───────────────────── */
-- Writes the given fields to the live record, replaces the page's sources and
-- appends a version row. The first time a page is touched, the content that
-- was live BEFORE the change is saved as version 1 ('baseline') so that even
-- the first publish can be undone. Fields missing from p_content are left
-- unchanged.

create or replace function apply_page_version(
  p_entity_type   text,
  p_entity_key    text,
  p_content       jsonb,
  p_source_ids    uuid[],
  p_origin        text,
  p_note          text,
  p_reverted_from uuid,
  p_user_id       uuid,
  p_user_email    text
)
returns page_versions
language plpgsql
as $$
declare
  v_before  jsonb;
  v_after   jsonb;
  v_last    int;
  v_sources jsonb;
  v_state   text;
  v_issue   text;
  v_idx     int;
  v_row     page_versions;
begin
  if p_origin not in ('refresh', 'revert') then
    raise exception 'invalid origin: %', p_origin;
  end if;

  -- One publish per page at a time.
  perform pg_advisory_xact_lock(hashtextextended(p_entity_type || ':' || p_entity_key, 0));

  v_before := page_live_content(p_entity_type, p_entity_key);

  select coalesce(max(version), 0) into v_last
    from page_versions
   where entity_type = p_entity_type and entity_key = p_entity_key;

  if v_last = 0 then
    select coalesce(jsonb_agg(jsonb_build_object(
                      'vault_document_id', vault_document_id,
                      'sort_order', sort_order) order by sort_order), '[]'::jsonb)
      into v_sources
      from page_sources
     where entity_type = p_entity_type and entity_key = p_entity_key;

    insert into page_versions (entity_type, entity_key, version, content, sources, origin, note)
    values (p_entity_type, p_entity_key, 1, v_before, v_sources, 'baseline',
            'Content before the first vault refresh');
    v_last := 1;
  end if;

  /* apply the fields to the live record */
  if p_entity_type = 'area' then
    update areas
       set overview   = coalesce(p_content->>'overview',   overview),
           prevention = coalesce(p_content->>'prevention', prevention),
           key_stats  = coalesce(p_content->'key_stats',   key_stats)
     where slug = p_entity_key;

  else
    v_state := split_part(p_entity_key, '/', 1);
    v_issue := split_part(p_entity_key, '/', 2);

    select (e.ord - 1)::int
      into v_idx
      from states s
      join issues i on i.slug = v_issue
      cross join lateral jsonb_array_elements(s.issues) with ordinality as e(item, ord)
     where s.slug = v_state
       and lower(e.item->>'name') = lower(i.title)
     limit 1;

    update states
       set issues = jsonb_set(
             issues,
             array[v_idx::text],
             (issues -> v_idx) || jsonb_strip_nulls(jsonb_build_object(
                 'stat', p_content->>'stat',
                 'desc', p_content->>'desc')))
     where slug = v_state;
  end if;

  /* replace the sources shown in the page footer */
  delete from page_sources
   where entity_type = p_entity_type and entity_key = p_entity_key;

  insert into page_sources (entity_type, entity_key, vault_document_id, sort_order)
  select p_entity_type, p_entity_key, d.id, (u.ord - 1)::int
    from unnest(coalesce(p_source_ids, '{}'::uuid[])) with ordinality as u(doc_id, ord)
    join vault_documents d on d.id = u.doc_id;

  v_after := page_live_content(p_entity_type, p_entity_key);

  select coalesce(jsonb_agg(jsonb_build_object(
                    'vault_document_id', vault_document_id,
                    'sort_order', sort_order) order by sort_order), '[]'::jsonb)
    into v_sources
    from page_sources
   where entity_type = p_entity_type and entity_key = p_entity_key;

  insert into page_versions (
    entity_type, entity_key, version, content, sources,
    origin, note, reverted_from, created_by, created_by_email)
  values (
    p_entity_type, p_entity_key, v_last + 1, v_after, v_sources,
    p_origin, p_note, p_reverted_from, p_user_id, p_user_email)
  returning * into v_row;

  return v_row;
end;
$$;
