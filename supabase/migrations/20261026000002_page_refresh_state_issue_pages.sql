-- Vault refresh: add the state overview page and the national issue page.
--
-- Extends 20261026000001_page_refresh_versions.sql (apply that one first).
--
--   state  entity_key = states.slug   fields: subtitle + each issue's stat/desc
--                                     (states.issues[], matched by issue name;
--                                     badges and the list of issues are never touched)
--   issue  entity_key = issues.slug   fields: short_desc, definition,
--                                     australian_data, mechanisms, anchor_stat
--
-- Idempotent: the constraints are replaced and both functions are re-created.

alter table page_versions drop constraint if exists page_versions_entity_type_check;
alter table page_versions
  add constraint page_versions_entity_type_check
  check (entity_type in ('area', 'state_issue', 'state', 'issue'));

alter table page_sources drop constraint if exists page_sources_entity_type_check;
alter table page_sources
  add constraint page_sources_entity_type_check
  check (entity_type in ('area', 'state_issue', 'state', 'issue'));

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

  elsif p_entity_type = 'state' then
    select jsonb_build_object(
             'subtitle', coalesce(s.subtitle, ''),
             'issues', (
               select coalesce(jsonb_agg(jsonb_build_object(
                        'name', e.item->>'name',
                        'stat', coalesce(e.item->>'stat', ''),
                        'desc', coalesce(e.item->>'desc', '')) order by e.ord), '[]'::jsonb)
                 from jsonb_array_elements(s.issues) with ordinality as e(item, ord)))
      into v
      from states s
     where s.slug = p_entity_key;

  elsif p_entity_type = 'issue' then
    select jsonb_build_object(
             'short_desc',      short_desc,
             'definition',      definition,
             'australian_data', australian_data,
             'mechanisms',      mechanisms,
             'anchor_stat',     anchor_stat)
      into v
      from issues
     where slug = p_entity_key;

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

  /* apply the fields to the live record; fields missing from p_content are left alone */
  if p_entity_type = 'area' then
    update areas
       set overview   = coalesce(p_content->>'overview',   overview),
           prevention = coalesce(p_content->>'prevention', prevention),
           key_stats  = coalesce(p_content->'key_stats',   key_stats)
     where slug = p_entity_key;

  elsif p_entity_type = 'state_issue' then
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

  elsif p_entity_type = 'state' then
    -- Update stat/desc of the existing issue entries (matched by name). The
    -- list, its order and each entry's badge/slug/name stay exactly as they are.
    update states s
       set subtitle = coalesce(p_content->>'subtitle', s.subtitle),
           issues = case when p_content ? 'issues' then (
             select coalesce(jsonb_agg(
                      case when u.item is not null
                           then e.item || jsonb_build_object('stat', u.item->>'stat', 'desc', u.item->>'desc')
                           else e.item end
                      order by e.ord), '[]'::jsonb)
               from jsonb_array_elements(s.issues) with ordinality as e(item, ord)
               left join lateral (
                 select x.item
                   from jsonb_array_elements(p_content->'issues') as x(item)
                  where lower(x.item->>'name') = lower(e.item->>'name')
                  limit 1) u on true
           ) else s.issues end
     where s.slug = p_entity_key;

  elsif p_entity_type = 'issue' then
    update issues
       set short_desc      = coalesce(p_content->>'short_desc',      short_desc),
           definition      = coalesce(p_content->>'definition',      definition),
           australian_data = coalesce(p_content->>'australian_data', australian_data),
           mechanisms      = coalesce(p_content->>'mechanisms',      mechanisms),
           anchor_stat     = coalesce(p_content->>'anchor_stat',     anchor_stat)
     where slug = p_entity_key;
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
