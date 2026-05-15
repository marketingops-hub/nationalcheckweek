/* ═══════════════════════════════════════════════════════════════════════════
 * Area-context loader for GEO pages.
 *
 * GEO drafts couple one `areas` row (the town) with one `issues` row (the
 * wellbeing topic). The generate edge fn needs the area's local data as
 * additional prompt context so the AI can write town-specific paragraphs
 * that still sit inside the citation contract (cited as [area:<slug>]).
 *
 * The `areas` table today exposes only `id, slug, name, state, type,
 * issues (jsonb), seo_title` — the richer descriptors (population,
 * overview, key_stats) live in src/lib/data/areas.json on the web side
 * and are NOT available server-side. We deliberately render only the
 * DB-available fields here so the edge fn has zero cross-runtime
 * coupling.
 *
 * Returns `null` when no matching row exists — the caller logs and falls
 * back to plain blog-style generation so a bad slug doesn't block the
 * pipeline.
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface AreaRow {
  id:         string;
  slug:       string;
  name:       string;
  state:      string;
  type:       string | null;
  issues:     unknown; // jsonb — see AreaIssueRow[]
  seo_title:  string | null;
}

/** One entry in `areas.issues`. Extra fields are ignored by design so the
 *  prompt block stays stable even if the schema gains columns. */
interface AreaIssueRow {
  title?:    string;
  severity?: string;
  stat?:     string;
  desc?:     string;
  /** Some historical rows use `description` instead of `desc` — accept either. */
  description?: string;
}

/** Fetch one area by slug via the Supabase REST API. Same pattern as the
 *  Vault + style loaders. Returns `null` for 404 / parse errors so the
 *  caller can gracefully degrade. */
export async function fetchAreaBySlug(
  sbUrl: string,
  sbKey: string,
  slug: string,
): Promise<AreaRow | null> {
  const url = `${sbUrl}/rest/v1/areas`
    + `?slug=eq.${encodeURIComponent(slug)}`
    + `&select=id,slug,name,state,type,issues,seo_title`
    + `&limit=1`;

  const res = await fetch(url, {
    headers: {
      apikey:        sbKey,
      Authorization: `Bearer ${sbKey}`,
      Accept:        'application/json',
    },
  });

  if (!res.ok) return null;

  const rows = await res.json() as AreaRow[];
  return rows[0] ?? null;
}

/**
 * Render the area row into a compact prompt block. Plain prose + bullets
 * rather than JSON because the model is better at quoting natural
 * language — everything here is citable as [area:<area.slug>].
 *
 * Tries to keep under ~1200 chars so it doesn't crowd the Vault block.
 */
export function formatAreaContext(area: AreaRow): string {
  const lines: string[] = [];
  lines.push(`AREA: ${area.name}, ${area.state}`);

  const issues = Array.isArray(area.issues) ? area.issues as AreaIssueRow[] : [];
  if (issues.length > 0) {
    lines.push('');
    lines.push('LOCAL WELLBEING ISSUES (severity · stat · description)');
    for (const i of issues) {
      if (!i?.title) continue;
      const sev  = i.severity ? ` [${i.severity}]` : '';
      const stat = i.stat     ? ` — ${i.stat}`     : '';
      lines.push(`- ${i.title}${sev}${stat}`);
      const desc = (i.desc ?? i.description ?? '').trim();
      if (desc) lines.push(`  ${desc}`);
    }
  } else {
    lines.push('(no local issue data on file — write general local commentary sparingly and flag uncertainty.)');
  }

  return lines.join('\n');
}
