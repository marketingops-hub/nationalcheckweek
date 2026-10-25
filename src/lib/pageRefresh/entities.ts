import { z } from "zod";

/**
 * Pages whose data can be refreshed from the vault.
 *
 *   area         entity_key = areas.slug
 *   state_issue  entity_key = "<state-slug>/<issue-slug>"; the refreshable
 *                fields are the state's own `stat` and `desc` for that issue
 *                (stored in states.issues[]).
 *   state        entity_key = states.slug; the subtitle plus the `stat` and
 *                `desc` of each of the state's issue cards (never the list of
 *                issues, their order or their badges).
 *   issue        entity_key = issues.slug; the national issue page text.
 */
export const ENTITY_TYPES = ["area", "state_issue", "state", "issue"] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const entityTypeSchema = z.enum(ENTITY_TYPES);

const SLUG = /^[a-z0-9][a-z0-9-]*$/;

export const entityKeySchema = z.string().min(1).max(200);

export function isValidEntityKey(type: EntityType, key: string): boolean {
  if (type !== "state_issue") return SLUG.test(key);
  const parts = key.split("/");
  return parts.length === 2 && parts.every((p) => SLUG.test(p));
}

export interface KeyStat {
  num: string;
  label: string;
}

export interface AreaContent {
  overview: string;
  prevention: string;
  key_stats: KeyStat[];
}

export interface StateIssueContent {
  stat: string;
  desc: string;
}

export interface StateIssueEntry {
  name: string;
  stat: string;
  desc: string;
}

export interface StateContent {
  subtitle: string;
  issues: StateIssueEntry[];
}

export interface IssueContent {
  short_desc: string;
  definition: string;
  australian_data: string;
  mechanisms: string;
  anchor_stat: string;
}

export type PageContent =
  | Partial<AreaContent>
  | Partial<StateIssueContent>
  | Partial<StateContent>
  | Partial<IssueContent>;

export const FIELD_LABELS: Record<string, string> = {
  overview: "Overview",
  prevention: "Prevention",
  key_stats: "Key stats",
  stat: "Headline stat",
  desc: "Description",
  subtitle: "Subtitle",
  issues: "Issue cards (stat + description)",
  short_desc: "Short description",
  definition: "Definition",
  australian_data: "Australian data",
  mechanisms: "Mechanisms",
  anchor_stat: "Anchor stat",
};

export const FIELDS: Record<EntityType, readonly string[]> = {
  area: ["overview", "prevention", "key_stats"],
  state_issue: ["stat", "desc"],
  state: ["subtitle", "issues"],
  issue: ["short_desc", "definition", "australian_data", "mechanisms", "anchor_stat"],
};

const keyStatSchema = z.object({
  num: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(120),
});

const areaShape = {
  overview: z.string().trim().min(1).max(4000),
  prevention: z.string().trim().min(1).max(4000),
  key_stats: z.array(keyStatSchema).min(1).max(6),
};

const stateIssueShape = {
  stat: z.string().trim().min(1).max(120),
  desc: z.string().trim().min(1).max(1200),
};

const stateShape = {
  subtitle: z.string().trim().min(1).max(300),
  issues: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        stat: z.string().trim().min(1).max(120),
        desc: z.string().trim().min(1).max(1200),
      }),
    )
    .min(1)
    .max(40),
};

const issueShape = {
  short_desc: z.string().trim().min(1).max(600),
  definition: z.string().trim().min(1).max(4000),
  australian_data: z.string().trim().min(1).max(4000),
  mechanisms: z.string().trim().min(1).max(4000),
  anchor_stat: z.string().trim().min(1).max(300),
};

const nonEmpty = (o: Record<string, unknown>) => Object.keys(o).length > 0;

/** Fields a staff member may publish: any non-empty subset of the page's fields. */
export const publishContentSchemas = {
  area: z.object(areaShape).partial().strict().refine(nonEmpty, "No fields to publish"),
  state_issue: z.object(stateIssueShape).partial().strict().refine(nonEmpty, "No fields to publish"),
  state: z.object(stateShape).partial().strict().refine(nonEmpty, "No fields to publish"),
  issue: z.object(issueShape).partial().strict().refine(nonEmpty, "No fields to publish"),
} as const;

/** What the model must return: every field of the page (unchanged ones copied through). */
export const modelContentSchemas = {
  area: z.object(areaShape).strict(),
  state_issue: z.object(stateIssueShape).strict(),
  state: z.object(stateShape).strict(),
  issue: z.object(issueShape).strict(),
} as const;

/** Public paths to revalidate after a publish or revert. */
export function pathsToRevalidate(type: EntityType, key: string): string[] {
  switch (type) {
    case "area":
      return [`/areas/${key}`];
    case "issue":
      return [`/issues/${key}`];
    case "state":
      return [`/states/${key}`];
    case "state_issue":
      return [`/states/${key.replace("/", "/issues/")}`, `/states/${key.split("/")[0]}`];
  }
}

/** Public URL of the page, for "View on site" links. */
export function publicPath(type: EntityType, key: string): string {
  switch (type) {
    case "area":
      return `/areas/${key}`;
    case "issue":
      return `/issues/${key}`;
    case "state":
      return `/states/${key}`;
    case "state_issue":
      return `/states/${key.replace("/", "/issues/")}`;
  }
}
