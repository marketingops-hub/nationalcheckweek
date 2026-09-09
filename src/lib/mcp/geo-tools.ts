/**
 * MCP tools for published state / region / issue content
 * (the same data that powers /states, /areas, /issues).
 */

import { adminClient } from '@/lib/adminClient';
import {
  parseAreaIssues,
  parseKeyStats,
  parseStateIssues,
} from '@/lib/schemas/geo';

export const GEO_TOOLS = [
  {
    name: 'list_states',
    description:
      'List published Australian states and territories with short descriptions. ' +
      'Use this first when exploring regional wellbeing data on National Check-in Week.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_state',
    description:
      'Get a published state/territory by slug or code (e.g. "victoria" or "VIC"), ' +
      'including priority wellbeing issues and the areas/regions within it.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'State slug (e.g. new-south-wales) or code (e.g. NSW)',
        },
      },
      required: ['slug'],
    },
  },
  {
    name: 'list_areas',
    description:
      'List published areas (cities, regions, LGAs) with optional filters. ' +
      'Each area includes a count of local priority issues.',
    inputSchema: {
      type: 'object',
      properties: {
        state_slug: {
          type: 'string',
          description: 'Filter to a state slug (e.g. victoria)',
        },
        type: {
          type: 'string',
          enum: ['city', 'region', 'lga'],
          description: 'Filter by area type',
        },
        search: {
          type: 'string',
          description: 'Keyword match on area name',
        },
        limit: {
          type: 'number',
          description: 'Max areas to return (default 40, max 100)',
        },
      },
    },
  },
  {
    name: 'get_area',
    description:
      'Get a published city/region/LGA by slug, including overview, key stats, ' +
      'local priority issues, and prevention notes.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'Area slug (e.g. melbourne)' },
      },
      required: ['slug'],
    },
  },
  {
    name: 'list_issues',
    description:
      'List the national student-wellbeing issue catalogue (rank, severity, short description).',
    inputSchema: {
      type: 'object',
      properties: {
        severity: {
          type: 'string',
          enum: ['critical', 'high', 'notable'],
          description: 'Optional severity filter',
        },
      },
    },
  },
  {
    name: 'get_issue',
    description:
      'Get a national wellbeing issue by slug. Optionally pass state_slug and/or area_slug ' +
      'to include location-specific framing and related areas that report the issue.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Issue slug (e.g. anxiety-depression, bullying)',
        },
        state_slug: {
          type: 'string',
          description: 'Optional state slug for state-specific issue data',
        },
        area_slug: {
          type: 'string',
          description: 'Optional area slug for area-specific issue data',
        },
      },
      required: ['slug'],
    },
  },
];

function issueCount(issues: unknown): number {
  return Array.isArray(issues) ? issues.length : 0;
}

function normalizeLookup(value: string): string {
  return value.trim().toLowerCase();
}

export async function toolListStates(): Promise<object> {
  const db = adminClient();
  const { data, error } = await db
    .from('states')
    .select('name, slug, code, description, color')
    .eq('published', true)
    .order('name');
  if (error) throw new Error(error.message);
  return { states: data ?? [], total: data?.length ?? 0 };
}

export async function toolGetState(args: { slug: string }): Promise<object> {
  const db = adminClient();
  const key = normalizeLookup(args.slug);
  if (!key) throw new Error('slug is required');

  const { data: bySlug, error: slugErr } = await db
    .from('states')
    .select('*')
    .eq('published', true)
    .eq('slug', key)
    .maybeSingle();
  if (slugErr) throw new Error(slugErr.message);

  let state = bySlug;
  if (!state) {
    const { data: byCode, error: codeErr } = await db
      .from('states')
      .select('*')
      .eq('published', true)
      .ilike('code', key)
      .maybeSingle();
    if (codeErr) throw new Error(codeErr.message);
    state = byCode;
  }

  if (!state) throw new Error(`Published state not found: ${args.slug}`);

  const { data: areas, error: areasErr } = await db
    .from('areas')
    .select('slug, name, type, population, schools, issues')
    .eq('state_slug', state.slug)
    .order('name');
  if (areasErr) throw new Error(areasErr.message);

  const stateIssues = parseStateIssues(state.issues);

  return {
    state: {
      name: state.name,
      slug: state.slug,
      code: state.code ?? null,
      description: state.description ?? state.subtitle ?? null,
      subtitle: state.subtitle ?? null,
      color: state.color ?? null,
      page_path: `/states/${state.slug}`,
    },
    priority_issues: stateIssues.map((i) => ({
      ...i,
      page_path: i.slug
        ? `/states/${state.slug}/issues/${i.slug}`
        : undefined,
    })),
    areas: (areas ?? []).map((a) => ({
      slug: a.slug,
      name: a.name,
      type: a.type,
      population: a.population,
      schools: a.schools,
      issue_count: issueCount(a.issues),
      page_path: `/areas/${a.slug}`,
    })),
    area_count: areas?.length ?? 0,
  };
}

export async function toolListAreas(args: {
  state_slug?: string;
  type?: string;
  search?: string;
  limit?: number;
}): Promise<object> {
  const db = adminClient();
  const limit = Math.min(Math.max(1, Math.floor(args.limit ?? 40)), 100);

  let q = db
    .from('areas')
    .select('slug, name, state, state_slug, type, population, schools, issues')
    .order('name')
    .limit(limit);

  if (args.state_slug) q = q.eq('state_slug', normalizeLookup(args.state_slug));
  if (args.type) q = q.eq('type', args.type);
  if (args.search?.trim()) q = q.ilike('name', `%${args.search.trim()}%`);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return {
    areas: (data ?? []).map((a) => ({
      slug: a.slug,
      name: a.name,
      state: a.state,
      state_slug: a.state_slug,
      type: a.type,
      population: a.population,
      schools: a.schools,
      issue_count: issueCount(a.issues),
      page_path: `/areas/${a.slug}`,
    })),
    total: data?.length ?? 0,
  };
}

export async function toolGetArea(args: { slug: string }): Promise<object> {
  const db = adminClient();
  const slug = normalizeLookup(args.slug);
  if (!slug) throw new Error('slug is required');

  const { data: area, error } = await db
    .from('areas')
    .select(
      'slug, name, state, state_slug, type, population, schools, overview, key_stats, issues, prevention',
    )
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!area) throw new Error(`Area not found: ${args.slug}`);

  return {
    area: {
      slug: area.slug,
      name: area.name,
      state: area.state,
      state_slug: area.state_slug,
      type: area.type,
      population: area.population,
      schools: area.schools,
      overview: area.overview,
      prevention: area.prevention,
      page_path: `/areas/${area.slug}`,
      state_page_path: `/states/${area.state_slug}`,
    },
    key_stats: parseKeyStats(area.key_stats),
    priority_issues: parseAreaIssues(area.issues).map((i) => ({
      ...i,
      page_path: i.slug ? `/issues/${i.slug}` : undefined,
    })),
  };
}

export async function toolListIssues(args: {
  severity?: string;
}): Promise<object> {
  const db = adminClient();
  let q = db
    .from('issues')
    .select('rank, slug, title, severity, icon, anchor_stat, short_desc')
    .order('rank');
  if (args.severity) q = q.eq('severity', args.severity);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return {
    issues: (data ?? []).map((i) => ({
      ...i,
      page_path: `/issues/${i.slug}`,
    })),
    total: data?.length ?? 0,
  };
}

export async function toolGetIssue(args: {
  slug: string;
  state_slug?: string;
  area_slug?: string;
}): Promise<object> {
  const db = adminClient();
  const slug = normalizeLookup(args.slug);
  if (!slug) throw new Error('slug is required');

  const { data: issue, error } = await db
    .from('issues')
    .select(
      'rank, slug, title, severity, icon, anchor_stat, short_desc, definition, australian_data, mechanisms, impacts, groups',
    )
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!issue) throw new Error(`Issue not found: ${args.slug}`);

  const result: Record<string, unknown> = {
    issue: {
      rank: issue.rank,
      slug: issue.slug,
      title: issue.title,
      severity: issue.severity,
      icon: issue.icon,
      anchor_stat: issue.anchor_stat,
      short_desc: issue.short_desc,
      definition: issue.definition,
      australian_data: issue.australian_data,
      mechanisms: issue.mechanisms,
      impacts: issue.impacts,
      groups: issue.groups,
      page_path: `/issues/${issue.slug}`,
    },
  };

  const stateSlug = args.state_slug ? normalizeLookup(args.state_slug) : '';
  if (stateSlug) {
    const { data: state, error: stateErr } = await db
      .from('states')
      .select('name, slug, code, issues')
      .eq('published', true)
      .eq('slug', stateSlug)
      .maybeSingle();
    if (stateErr) throw new Error(stateErr.message);
    if (!state) throw new Error(`Published state not found: ${args.state_slug}`);

    const stateIssues = parseStateIssues(state.issues);
    const stateIssue =
      stateIssues.find((i) => i.slug === slug) ||
      stateIssues.find((i) =>
        i.name.toLowerCase().includes(issue.title.toLowerCase().slice(0, 12)),
      ) ||
      null;

    const { data: relatedAreas, error: areasErr } = await db
      .from('areas')
      .select('slug, name, type, issues')
      .eq('state_slug', state.slug);
    if (areasErr) throw new Error(areasErr.message);

    const areasWithIssue = (relatedAreas ?? []).filter((area) => {
      const areaIssues = parseAreaIssues(area.issues);
      return areaIssues.some(
        (ai) =>
          ai.slug === slug ||
          ai.title.toLowerCase() === issue.title.toLowerCase(),
      );
    });

    result.state_context = {
      name: state.name,
      slug: state.slug,
      code: state.code,
      page_path: `/states/${state.slug}/issues/${issue.slug}`,
      state_specific: stateIssue,
      areas_reporting_issue: areasWithIssue.map((a) => ({
        slug: a.slug,
        name: a.name,
        type: a.type,
        page_path: `/areas/${a.slug}`,
        local_issue: parseAreaIssues(a.issues).find(
          (ai) =>
            ai.slug === slug ||
            ai.title.toLowerCase() === issue.title.toLowerCase(),
        ),
      })),
    };
  }

  const areaSlug = args.area_slug ? normalizeLookup(args.area_slug) : '';
  if (areaSlug) {
    const { data: area, error: areaErr } = await db
      .from('areas')
      .select('slug, name, state, state_slug, type, issues')
      .eq('slug', areaSlug)
      .maybeSingle();
    if (areaErr) throw new Error(areaErr.message);
    if (!area) throw new Error(`Area not found: ${args.area_slug}`);

    const local = parseAreaIssues(area.issues).find(
      (ai) =>
        ai.slug === slug ||
        ai.title.toLowerCase() === issue.title.toLowerCase(),
    );

    result.area_context = {
      slug: area.slug,
      name: area.name,
      state: area.state,
      state_slug: area.state_slug,
      type: area.type,
      page_path: `/areas/${area.slug}`,
      local_issue: local ?? null,
    };
  }

  return result;
}

export async function callGeoTool(
  name: string,
  args: Record<string, unknown>,
): Promise<object | null> {
  switch (name) {
    case 'list_states':
      return toolListStates();
    case 'get_state':
      return toolGetState(args as { slug: string });
    case 'list_areas':
      return toolListAreas(
        args as {
          state_slug?: string;
          type?: string;
          search?: string;
          limit?: number;
        },
      );
    case 'get_area':
      return toolGetArea(args as { slug: string });
    case 'list_issues':
      return toolListIssues(args as { severity?: string });
    case 'get_issue':
      return toolGetIssue(
        args as { slug: string; state_slug?: string; area_slug?: string },
      );
    default:
      return null;
  }
}
