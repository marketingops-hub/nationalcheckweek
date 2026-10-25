import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminClient } from "@/lib/adminClient";
import { anthropicService } from "@/lib/ai/anthropic-service";
import {
  FIELDS,
  FIELD_LABELS,
  isValidEntityKey,
  pathsToRevalidate,
  publishContentSchemas,
  type EntityType,
} from "./entities";
import { fieldText, reviewEvidence, type EvidenceItem } from "./evidence";
import { safeSourceUrl, sourceLabel, type SourceDoc } from "./format";
import { groupChunks, type GroupedDoc } from "./group";
import { describeAiError } from "./aiError";
import { fetchAllChunks } from "./chunks";
import { RefreshError } from "./errors";
import { rankChunksForText } from "./rank";
import { retrieveForPage } from "./retrieve";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  changedFields,
  parseModelOutput,
  reconcileStateIssues,
  type PromptDoc,
} from "./prompt";

export { RefreshError };

export interface PreviewSource {
  id: string;
  title: string;
  label: string;
  url: string | null;
  year: string | null;
  cited: boolean;
}

export interface RefreshPreview {
  entityType: EntityType;
  entityKey: string;
  subject: string;
  current: Record<string, unknown>;
  proposed: Record<string, unknown>;
  changed: string[];
  sources: PreviewSource[];
  /** Per changed field: the quotes behind it, each checked against the documents. */
  evidence: Record<string, EvidenceItem[]>;
  /** Per changed field: new figures that could not be found in the excerpts. */
  unsupported: Record<string, string[]>;
  warnings: string[];
}

export interface PageContext {
  subject: string;
  current: Record<string, unknown>;
  query: string;
}

export const MODEL = "claude-sonnet-4-6";
// The preview route may run for at most 120s (maxDuration): one slow attempt
// (55s) plus a retry started before the 40s mark (55s) still fits.
const AI_ATTEMPT_TIMEOUT_MS = 55_000;
const RETRY_ONLY_IF_UNDER_MS = 40_000;

export function assertKey(type: EntityType, key: string) {
  if (!isValidEntityKey(type, key)) throw new RefreshError("Invalid page.", 400);
}

/** Current content of the page plus what to search the vault for. */
export async function loadContext(db: SupabaseClient, type: EntityType, key: string): Promise<PageContext> {
  if (type === "area") {
    const { data } = await db
      .from("areas")
      .select("name, state, overview, prevention, key_stats")
      .eq("slug", key)
      .maybeSingle();
    if (!data) throw new RefreshError("Area not found.", 404);
    return {
      subject: `${data.name}, ${data.state}`,
      current: { overview: data.overview, prevention: data.prevention, key_stats: data.key_stats ?? [] },
      query: `${data.name} ${data.state} young people student wellbeing mental health statistics`,
    };
  }

  if (type === "issue") {
    const { data } = await db
      .from("issues")
      .select("title, short_desc, definition, australian_data, mechanisms, anchor_stat")
      .eq("slug", key)
      .maybeSingle();
    if (!data) throw new RefreshError("Issue not found.", 404);
    return {
      subject: `${data.title} (national issue page)`,
      current: {
        short_desc: data.short_desc,
        definition: data.definition,
        australian_data: data.australian_data,
        mechanisms: data.mechanisms,
        anchor_stat: data.anchor_stat,
      },
      query: `${data.title} Australian students young people prevalence statistics research`,
    };
  }

  if (type === "state") {
    const { data } = await db.from("states").select("name, subtitle, issues").eq("slug", key).maybeSingle();
    if (!data) throw new RefreshError("State not found.", 404);
    const cards = ((data.issues ?? []) as { name?: string; stat?: string; desc?: string }[])
      .filter((i) => i.name)
      .map((i) => ({ name: i.name as string, stat: i.stat ?? "", desc: i.desc ?? "" }));
    if (cards.length === 0) throw new RefreshError(`${data.name} has no issue cards to refresh yet.`, 404);
    return {
      subject: `${data.name} (state overview page)`,
      current: { subtitle: data.subtitle ?? "", issues: cards },
      query: `${data.name} students schools Australia wellbeing mental health statistics`,
    };
  }

  const [stateSlug, issueSlug] = key.split("/");
  const [{ data: state }, { data: issue }] = await Promise.all([
    db.from("states").select("name, issues").eq("slug", stateSlug).maybeSingle(),
    db.from("issues").select("title").eq("slug", issueSlug).maybeSingle(),
  ]);
  if (!state || !issue) throw new RefreshError("State or issue not found.", 404);
  const entry = ((state.issues ?? []) as { name?: string; stat?: string; desc?: string }[]).find(
    (i) => i.name?.toLowerCase() === issue.title.toLowerCase(),
  );
  if (!entry) {
    throw new RefreshError(`${state.name} has no "${issue.title}" entry to refresh. Add it to the state first.`, 404);
  }
  return {
    subject: `${issue.title} in ${state.name}`,
    current: { stat: entry.stat ?? "", desc: entry.desc ?? "" },
    query: `${issue.title} ${state.name} students Australia prevalence statistics`,
  };
}

export interface VaultMeta extends SourceDoc {
  id: string;
}

export async function loadDocMeta(db: SupabaseClient, ids: string[]): Promise<Map<string, VaultMeta>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await db
    .from("vault_documents")
    .select("id, title, reference, author, publisher, year, page_ref, source_url")
    .in("id", ids);
  if (error) throw new RefreshError(`Could not read vault documents: ${error.message}`, 500);
  return new Map((data ?? []).map((d) => [d.id as string, d as VaultMeta]));
}

export function toPreviewSource(meta: VaultMeta, cited: boolean): PreviewSource {
  return {
    id: meta.id,
    title: meta.title,
    label: sourceLabel(meta),
    url: safeSourceUrl(meta.source_url),
    year: meta.year == null ? null : String(meta.year),
    cited,
  };
}

/** Excerpts for a draft written only from the documents the reviewer chose, ranked by relevance to the page. */
async function groupFromChosen(db: SupabaseClient, ctx: PageContext, ids: string[]): Promise<GroupedDoc[]> {
  if (ids.length > 12) throw new RefreshError("Use at most 12 sources at a time.", 400);
  const meta = await loadDocMeta(db, ids);
  if (meta.size !== ids.length) throw new RefreshError("One of the selected documents no longer exists.", 400);
  const titles = new Map([...meta].map(([id, m]) => [id, m.title]));

  const all = await fetchAllChunks(db, ids, titles);
  if (all.length === 0) {
    throw new RefreshError("The selected documents have no indexed text yet. Wait until they show as Ready in the vault.", 422);
  }
  // Relevance to the page: what it is about, plus what it currently says.
  // Favour passages with figures: the aim is to find statistics to use.
  const grouped = rankChunksForText(all, `${ctx.query} ${fieldText(ctx.current)}`, {
    preferStats: true,
    perDoc: 8,
    maxTotalChars: 30000,
  });
  if (grouped.length === 0) {
    throw new RefreshError("Nothing in the ticked documents looks relevant to this page. Tick other documents or add more.", 422);
  }
  return grouped;
}

/** Search the vault, ask the model for refreshed content, and return it for review. Nothing is saved. */
export async function previewRefresh(
  type: EntityType,
  key: string,
  opts: { sourceIds?: string[] } = {},
): Promise<RefreshPreview> {
  assertKey(type, key);
  const db = adminClient();
  const ctx = await loadContext(db, type, key);

  // "Regenerate": the reviewer chose the documents, so write the draft from
  // those only. Otherwise search the whole vault.
  const chosen = [...new Set(opts.sourceIds ?? [])];
  let grouped: GroupedDoc[];
  if (chosen.length > 0) {
    grouped = await groupFromChosen(db, ctx, chosen);
  } else {
    // Two angles (what the page is about; the statistics about it), merged, so a
    // document rich in figures is found even if another document dominates the topic search.
    grouped = groupChunks(
      await retrieveForPage(db, [ctx.query, `${ctx.subject} statistics percentage of students survey findings results`]),
      { maxDocs: 8, perDoc: 4 },
    );
    if (grouped.length === 0) {
      throw new RefreshError("No relevant, indexed documents were found in the vault for this page.", 422);
    }
  }

  const meta = await loadDocMeta(db, [...new Set([...grouped.map((g) => g.document_id), ...chosen])]);
  const docs: PromptDoc[] = grouped.map((g, i) => {
    const m = meta.get(g.document_id);
    return {
      n: i + 1,
      title: m?.title ?? g.title,
      year: m?.year == null ? null : String(m.year),
      author: m?.author ?? null,
      chunks: g.chunks.map((c) => ({ page: c.chunk_page, heading: c.chunk_heading, content: c.content })),
    };
  });

  const userPrompt = buildUserPrompt({
    entityType: type,
    subject: ctx.subject,
    current: ctx.current,
    docs,
    reviewerChoseSources: chosen.length > 0,
  });

  // One automatic retry: if the reply is unusable (for example a field is too
  // long), tell the model exactly what was wrong and ask again.
  let proposal;
  let feedback = "";
  const started = Date.now();
  for (let attempt = 1; attempt <= 2; attempt++) {
    let raw: string;
    try {
      const res = await anthropicService.generateContent(SYSTEM_PROMPT, userPrompt + feedback, {
        model: MODEL,
        temperature: 0.2,
        maxTokens: 3500,
        timeout: AI_ATTEMPT_TIMEOUT_MS,
      });
      raw = res.content;
    } catch (err) {
      throw new RefreshError(describeAiError(err), 502);
    }

    try {
      proposal = parseModelOutput(raw, type, docs.length);
      break;
    } catch (err) {
      const problem = err instanceof Error ? err.message : "Unusable reply.";
      // Retry only when there is time left inside the route's time limit.
      if (attempt === 2 || Date.now() - started > RETRY_ONLY_IF_UNDER_MS) throw new RefreshError(problem, 502);
      console.warn("[page-refresh] invalid AI reply, retrying:", problem);
      feedback = `\n\nYOUR PREVIOUS REPLY WAS REJECTED: ${problem}\nReturn the JSON again, fixing exactly that problem and respecting every length limit.`;
    }
  }
  if (!proposal) throw new RefreshError("The AI returned an unusable response. Try again.", 502);

  if (type === "state") {
    proposal.content.issues = reconcileStateIssues(
      ctx.current.issues as { name: string; stat: string; desc: string }[],
      proposal.content.issues as { name: string; stat: string; desc: string }[],
    );
  }

  const changed = changedFields(type, ctx.current, proposal.content);
  const citedIds = new Set(proposal.sourcesUsed.map((n) => grouped[n - 1].document_id));

  const sources: PreviewSource[] = grouped
    .map((g) => ({ g, cited: citedIds.has(g.document_id) }))
    .filter(({ g }) => meta.has(g.document_id))
    .map(({ g, cited }) => toPreviewSource(meta.get(g.document_id)!, cited))
    .sort((a, b) => Number(b.cited) - Number(a.cited));
  for (const id of chosen) {
    if (meta.has(id) && !sources.some((src) => src.id === id)) sources.push(toPreviewSource(meta.get(id)!, false));
  }

  const review = reviewEvidence({
    changed,
    fieldLabels: FIELD_LABELS,
    current: ctx.current,
    proposed: proposal.content,
    docs: grouped,
    raw: proposal.evidence,
    describe: (id) => {
      const m = meta.get(id);
      return m ? { label: sourceLabel(m), url: safeSourceUrl(m.source_url) } : { label: "Unknown document", url: null };
    },
  });
  // A document the quotes come from counts as cited, even if the model forgot to list it.
  for (const items of Object.values(review.evidence)) for (const it of items) if (it.verified) citedIds.add(it.sourceId);
  for (const src of sources) if (citedIds.has(src.id)) src.cited = true;
  sources.sort((a, b) => Number(b.cited) - Number(a.cited));

  // Problems with a specific field (no quote, unverified quote, untraceable figure) are shown on that
  // field's card, so this list only holds notes about the page as a whole.
  const warnings: string[] = [];
  if (changed.length > 0 && citedIds.size === 0) {
    warnings.push("The AI changed content without citing any document. Check the proposal carefully before publishing.");
  }
  if (changed.length === 0) {
    const passages = grouped.reduce((n, g) => n + g.chunks.length, 0);
    warnings.push(
      chosen.length > 0
        ? `The AI read ${passages} passage${passages === 1 ? "" : "s"} from ${grouped.length} of the ticked document${grouped.length === 1 ? "" : "s"} and found no figures that improve this page. Use Edit to add a figure yourself, or tick other documents.`
        : `The AI read ${passages} passage${passages === 1 ? "" : "s"} from ${grouped.length} document${grouped.length === 1 ? "" : "s"} in the vault and found nothing newer for this page. Add more documents on the Sources tab if you expect better figures.`,
    );
  }

  return {
    entityType: type,
    entityKey: key,
    subject: ctx.subject,
    current: ctx.current,
    proposed: proposal.content,
    changed,
    sources,
    evidence: review.evidence,
    unsupported: review.unsupported,
    warnings,
  };
}

export interface Actor {
  id: string | null;
  email: string | null;
}

export interface VersionSummary {
  id: string;
  version: number;
  origin: "baseline" | "refresh" | "revert";
  note: string | null;
  content: Record<string, unknown>;
  source_count: number;
  created_at: string;
  created_by_email: string | null;
  reverted_from: string | null;
}

function summarize(row: Record<string, unknown>): VersionSummary {
  return {
    id: row.id as string,
    version: row.version as number,
    origin: row.origin as VersionSummary["origin"],
    note: (row.note as string | null) ?? null,
    content: (row.content as Record<string, unknown>) ?? {},
    source_count: Array.isArray(row.sources) ? row.sources.length : 0,
    created_at: row.created_at as string,
    created_by_email: (row.created_by_email as string | null) ?? null,
    reverted_from: (row.reverted_from as string | null) ?? null,
  };
}

function revalidate(type: EntityType, key: string) {
  for (const p of pathsToRevalidate(type, key)) revalidatePath(p);
}

/** Publish reviewed fields (any subset) and the documents they came from. */
export async function publishRefresh(input: {
  type: EntityType;
  key: string;
  content: unknown;
  sourceIds: string[];
  note?: string | null;
  actor: Actor;
}): Promise<VersionSummary> {
  assertKey(input.type, input.key);
  const parsed = publishContentSchemas[input.type].safeParse(input.content);
  if (!parsed.success) {
    throw new RefreshError(`Invalid content: ${parsed.error.issues[0]?.message ?? "check the fields"}`, 400);
  }
  const allowed = new Set(FIELDS[input.type]);
  if (Object.keys(parsed.data).some((k) => !allowed.has(k))) throw new RefreshError("Unknown field.", 400);

  const db = adminClient();
  const sourceIds = [...new Set(input.sourceIds)];
  const meta = await loadDocMeta(db, sourceIds);
  if (meta.size !== sourceIds.length) throw new RefreshError("One of the selected documents no longer exists.", 400);

  return applyVersion(db, {
    type: input.type,
    key: input.key,
    content: parsed.data,
    sourceIds,
    origin: "refresh",
    note: input.note?.trim().slice(0, 300) || null,
    revertedFrom: null,
    actor: input.actor,
  });
}

interface ApplyArgs {
  type: EntityType;
  key: string;
  content: Record<string, unknown>;
  sourceIds: string[];
  origin: "refresh" | "revert";
  note: string | null;
  revertedFrom: string | null;
  actor: Actor;
}

async function applyVersion(db: SupabaseClient, a: ApplyArgs): Promise<VersionSummary> {
  const { data, error } = await db.rpc("apply_page_version", {
    p_entity_type: a.type,
    p_entity_key: a.key,
    p_content: a.content,
    p_source_ids: a.sourceIds,
    p_origin: a.origin,
    p_note: a.note,
    p_reverted_from: a.revertedFrom,
    p_user_id: a.actor.id,
    p_user_email: a.actor.email,
  });
  if (error) {
    if (error.code === "P0002") throw new RefreshError("Page not found.", 404);
    throw new RefreshError(`Could not publish: ${error.message}`, 500);
  }
  revalidate(a.type, a.key);
  return summarize(data as Record<string, unknown>);
}

export async function listVersions(type: EntityType, key: string): Promise<VersionSummary[]> {
  assertKey(type, key);
  const db = adminClient();
  const { data, error } = await db
    .from("page_versions")
    .select("id, version, origin, note, content, sources, created_at, created_by_email, reverted_from")
    .eq("entity_type", type)
    .eq("entity_key", key)
    .order("version", { ascending: false })
    .limit(50);
  if (error) throw new RefreshError(`Could not load versions: ${error.message}`, 500);
  return (data ?? []).map((r) => summarize(r));
}

/** Restore an earlier version. This publishes it as a NEW version, so history is never rewritten. */
export async function revertToVersion(versionId: string, actor: Actor): Promise<VersionSummary> {
  const db = adminClient();
  const { data: row, error } = await db
    .from("page_versions")
    .select("id, entity_type, entity_key, version, content, sources")
    .eq("id", versionId)
    .maybeSingle();
  if (error || !row) throw new RefreshError("Version not found.", 404);

  const type = row.entity_type as EntityType;
  const key = row.entity_key as string;
  assertKey(type, key);

  const sourceIds = ((row.sources ?? []) as { vault_document_id: string; sort_order: number }[])
    .sort((x, y) => x.sort_order - y.sort_order)
    .map((s) => s.vault_document_id);

  return applyVersion(db, {
    type,
    key,
    content: row.content as Record<string, unknown>,
    sourceIds,
    origin: "revert",
    note: `Reverted to version ${row.version}`,
    revertedFrom: row.id as string,
    actor,
  });
}
