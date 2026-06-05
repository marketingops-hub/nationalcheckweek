/* ═══════════════════════════════════════════════════════════════════════════
 * Geo & issue content — Zod schemas for JSONB columns.
 *
 * These columns (issues.impacts, issues.groups, states.issues, areas.issues,
 * areas.key_stats, …) are free-form JSONB authored through the admin. They are
 * read on PUBLIC, statically-generated pages, so validation here must
 * GRACEFULLY DEGRADE: a malformed blob should yield an empty list (and a
 * server log), never a thrown error that 500s the page.
 *
 * Each exported `parseX` helper replaces an unsafe `as SomeType[]` cast in the
 * geo/issue templates with a validated, defaulted parse.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { z } from "zod";

const text = z.string();

/* ── Issue page (issues/[slug]) ─────────────────────────────────────────── */

export const ImpactSchema = z.object({
  title: text,
  text: text,
});
export type Impact = z.infer<typeof ImpactSchema>;

const ImpactsSchema = z.array(ImpactSchema);
const StringListSchema = z.array(z.string());

/* ── State page (states/[slug]) ─────────────────────────────────────────── */

export const StateIssueSchema = z.object({
  name: text,
  badge: text,
  stat: text,
  desc: text,
  slug: text.optional(),
});
export type StateIssue = z.infer<typeof StateIssueSchema>;

const StateIssuesSchema = z.array(StateIssueSchema);

/* ── Area page (areas/[slug]) ───────────────────────────────────────────── */

export const AreaIssueSchema = z.object({
  title: text,
  severity: text,
  stat: text,
  desc: text,
  slug: text.optional(),
});
export type AreaIssue = z.infer<typeof AreaIssueSchema>;

export const KeyStatSchema = z.object({
  num: text,
  label: text,
});
export type KeyStat = z.infer<typeof KeyStatSchema>;

const AreaIssuesSchema = z.array(AreaIssueSchema);
const KeyStatsSchema = z.array(KeyStatSchema);

/* ── Parse helpers — each logs and returns [] on malformed input ────────── */

function safeParseList<S extends z.ZodTypeAny>(
  schema: S,
  value: unknown,
  label: string
): z.infer<S> {
  const result = schema.safeParse(value ?? []);
  if (!result.success) {
    console.error(`[schemas/geo] malformed ${label} JSONB:`, result.error.issues);
    return [] as z.infer<S>;
  }
  return result.data;
}

export const parseImpacts = (v: unknown) => safeParseList(ImpactsSchema, v, "issue.impacts");
export const parseGroups = (v: unknown) => safeParseList(StringListSchema, v, "issue.groups");
export const parseSourceStrings = (v: unknown) => safeParseList(StringListSchema, v, "issue.sources");
export const parseStateIssues = (v: unknown) => safeParseList(StateIssuesSchema, v, "state.issues");
export const parseAreaIssues = (v: unknown) => safeParseList(AreaIssuesSchema, v, "area.issues");
export const parseKeyStats = (v: unknown) => safeParseList(KeyStatsSchema, v, "area.key_stats");
