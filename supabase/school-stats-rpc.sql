-- ═══════════════════════════════════════════════════════
--  Postgres RPC: get_state_school_stats
--  Replaces the JS aggregation in /api/states/[slug]/schools
--  that previously fetched up to 5000 raw rows and computed
--  countBy / avgPct in Node.js.
--
--  Run once in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════

create or replace function get_state_school_stats(p_state text)
returns json
language sql
stable
security definer
as $$
  select json_build_object(
    'state_code',            p_state,
    'total_schools',         count(*)::int,
    'total_enrolments',      coalesce(sum(total_enrolments), 0)::int,
    'avg_icsea',             round(avg(icsea))::int,

    -- sector breakdown: { "Government": 412, "Catholic": 120, ... }
    'sectors', (
      select json_object_agg(coalesce(school_sector, 'Unknown'), cnt)
      from (
        select school_sector, count(*)::int as cnt
        from school_profiles
        where state = p_state
        group by school_sector
      ) s
    ),

    -- school type breakdown
    'types', (
      select json_object_agg(coalesce(school_type, 'Unknown'), cnt)
      from (
        select school_type, count(*)::int as cnt
        from school_profiles
        where state = p_state
        group by school_type
      ) t
    ),

    -- geolocation breakdown
    'geolocation', (
      select json_object_agg(coalesce(geolocation, 'Unknown'), cnt)
      from (
        select geolocation, count(*)::int as cnt
        from school_profiles
        where state = p_state
        group by geolocation
      ) g
    ),

    -- percentage averages (rounded to 1 decimal)
    'indigenous_avg_pct',     round(avg(indigenous_enrolments_pct)::numeric, 1),
    'lbote_avg_pct',          round(avg(lbote_yes_pct)::numeric, 1),
    'bottom_quarter_avg_pct', round(avg(bottom_sea_quarter_pct)::numeric, 1)
  )
  from school_profiles
  where state = p_state;
$$;

-- Allow anon + authenticated to call it
grant execute on function get_state_school_stats(text) to anon, authenticated;
