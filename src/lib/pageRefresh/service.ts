import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminClient } from "@/lib/adminClient";
import { anthropicService } from "@/lib/ai/anthropic-service";
import {
  FIELDS,
  isValidEntityKey,
  pathsToRevalidate,
  publishContentSchemas,
  type EntityType,
} from "./entities";
import { safeSourceUrl, sourceLabel, type SourceDoc } from "./format";
import { groupChunks } from "./group";
import { retrieveChunks } from "./retrieve";
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  changedFields,
  parseModelOutput,
  reconcileStateIssues,
  type PromptDoc,
} from "./prompt";

export class RefreshError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

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
  warnings: string[];
}

interface PageContext {
  subject: string;
  current: Record<string, unknown>;
  query: string;
}

const MODEL = "claude-sonnet-4-6";

function assertKey(type: EntityType, key: string) {
  if (!isValidEntityKey(type, key)) throw new RefreshError("Invalid page.", 400);
}

/** Current content of the page plus what to search the vault for. */
async function loadContext(db: SupabaseClient, type: EntityType, key: string): Promise<PageContext> {
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

interface VaultMeta extends SourceDoc {
  id: string;
}

async function loadDocMeta(db: SupabaseClient, ids: string[]): Promise<Map<string, VaultMeta>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await db
    .from("vault_documents")
    .select("id, title, reference, author, publisher, year, page_ref, source_url")
    .in("id", ids);
  if (error) throw new RefreshError(`Could not read vault documents: ${error.message}`, 500);
  return new Map((data ?? []).map((d) => [d.id as string, d as VaultMeta]));
}

function toPreviewSource(meta: VaultMeta, cited: boolean): PreviewSource {
  return {
    id: meta.id,
    title: meta.title,
    label: sourceLabel(meta),
    url: safeSourceUrl(meta.source_url),
    year: meta.year == null ? null : String(meta.year),
    cited,
  };
}

/** Search the vault, ask the model for refreshed content, and return it for review. Nothing is saved. */
export async function previewRefresh(type: EntityType, key: string): Promise<RefreshPreview> {
  assertKey(type, key);
  const db = adminClient();
  const ctx = await loadContext(db, type, key);

  const grouped = groupChunks(await retrieveChunks(db, ctx.query));
  if (grouped.length === 0) {
    throw new RefreshError("No relevant, indexed documents were found in the vault for this page.", 422);
  }

  const meta = await loadDocMeta(db, grouped.map((g) => g.document_id));
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

  let raw: string;
  try {
    const res = await anthropicService.generateContent(
      SYSTEM_PROMPT,
      buildUserPrompt({ entityType: type, subject: ctx.subject, current: ctx.current, docs }),
      { model: MODEL, temperature: 0.2, maxTokens: 3000, timeout: 90000 },
    );
    raw = res.content;
  } catch (err) {
    throw new RefreshError(err instanceof Error ? err.message : "AI generation failed.", 502);
  }

  let proposal;
  try {
    proposal = parseModelOutput(raw, type, docs.length);
  } catch (err) {
    throw new RefreshError(err instanceof Error ? err.message : "Unusable AI response.", 502);
  }

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

  const warnings: string[] = [];
  if (changed.length > 0 && citedIds.size === 0) {
    warnings.push("The AI changed content without citing any document. Check the proposal carefully before publishing.");
  }
  if (changed.length === 0) warnings.push("The vault has nothing newer for this page. The content would not change.");
  const uncited = sources.filter((s) => s.cited && !s.url);
  if (uncited.length > 0) {
    warnings.push(
      `${uncited.length} cited document${uncited.length > 1 ? "s have" : " has"} no public link and will show as plain text in the page footer.`,
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
