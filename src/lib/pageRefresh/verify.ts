import { adminClient } from "@/lib/adminClient";
import { anthropicService } from "@/lib/ai/anthropic-service";
import { describeAiError } from "./aiError";
import { FIELD_LABELS, modelContentSchemas, type EntityType } from "./entities";
import { fieldText, reviewEvidence, type EvidenceItem } from "./evidence";
import {
  SYSTEM_PROMPT,
  buildEvidencePrompt,
  changedFields,
  parseEvidenceOutput,
  reconcileStateIssues,
  type PromptDoc,
} from "./prompt";
import { fetchAllChunks } from "./chunks";
import { rankChunksForText } from "./rank";
import {
  MODEL,
  RefreshError,
  assertKey,
  loadContext,
  loadDocMeta,
} from "./service";
import { safeSourceUrl, sourceLabel } from "./format";

const MAX_SOURCES = 12;

export interface VerifyResult {
  changed: string[];
  evidence: Record<string, EvidenceItem[]>;
  unsupported: Record<string, string[]>;
  warnings: string[];
  /** documents the draft was checked against */
  checkedSourceIds: string[];
}

/**
 * Re-run verification of an edited draft against the documents the reviewer
 * selected (original and newly added). Nothing is saved. The AI finds quotes
 * that support the edited wording; the server then checks every quote and
 * every new figure against the full text of those documents.
 */
export async function verifyDraft(input: {
  type: EntityType;
  key: string;
  proposed: unknown;
  sourceIds: string[];
}): Promise<VerifyResult> {
  assertKey(input.type, input.key);

  const parsed = modelContentSchemas[input.type].safeParse(input.proposed);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new RefreshError(`The edited content is not valid (${first?.path.join(".") || "content"}: ${first?.message}).`, 400);
  }
  const sourceIds = [...new Set(input.sourceIds)];
  if (sourceIds.length === 0) throw new RefreshError("Tick at least one source to verify against.", 400);
  if (sourceIds.length > MAX_SOURCES) throw new RefreshError(`Verify against at most ${MAX_SOURCES} sources at a time.`, 400);

  const db = adminClient();
  const ctx = await loadContext(db, input.type, input.key);
  const proposed = parsed.data as Record<string, unknown>;
  if (input.type === "state") {
    proposed.issues = reconcileStateIssues(
      ctx.current.issues as { name: string; stat: string; desc: string }[],
      proposed.issues as { name: string; stat: string; desc: string }[],
    );
  }

  const changed = changedFields(input.type, ctx.current, proposed);
  if (changed.length === 0) {
    return { changed, evidence: {}, unsupported: {}, warnings: ["Nothing differs from the current page, so there is nothing to verify."], checkedSourceIds: sourceIds };
  }

  const meta = await loadDocMeta(db, sourceIds);
  if (meta.size !== sourceIds.length) throw new RefreshError("One of the selected documents no longer exists.", 400);
  const titles = new Map([...meta].map(([id, m]) => [id, m.title]));

  const all = await fetchAllChunks(db, sourceIds, titles);
  if (all.length === 0) {
    throw new RefreshError("The selected documents have no indexed text yet. Wait until they show as Ready in the vault.", 422);
  }
  const fullText = all.map((c) => c.content).join("\n");

  const changedText = changed.map((f) => fieldText(proposed[f])).join("\n");
  const grouped = rankChunksForText(all, changedText);
  if (grouped.length === 0) {
    // Nothing in the selected documents overlaps the text at all.
    const empty = reviewEvidence({
      changed,
      fieldLabels: FIELD_LABELS,
      current: ctx.current,
      proposed,
      docs: [],
      raw: {},
      describe: () => ({ label: "Unknown document", url: null }),
      fullText,
    });
    return { changed, evidence: empty.evidence, unsupported: empty.unsupported, warnings: [], checkedSourceIds: sourceIds };
  }

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
      buildEvidencePrompt({
        entityType: input.type,
        subject: ctx.subject,
        fields: changed.map((f) => ({
          field: f,
          label: FIELD_LABELS[f] ?? f,
          text: typeof proposed[f] === "string" ? (proposed[f] as string) : JSON.stringify(proposed[f]),
        })),
        docs,
      }),
      { model: MODEL, temperature: 0, maxTokens: 2000, timeout: 55_000 },
    );
    raw = res.content;
  } catch (err) {
    throw new RefreshError(describeAiError(err), 502);
  }

  let evidence;
  try {
    evidence = parseEvidenceOutput(raw, input.type, docs.length);
  } catch (err) {
    throw new RefreshError(err instanceof Error ? err.message : "Unusable AI response.", 502);
  }

  const review = reviewEvidence({
    changed,
    fieldLabels: FIELD_LABELS,
    current: ctx.current,
    proposed,
    docs: grouped,
    raw: evidence,
    describe: (id) => {
      const m = meta.get(id);
      return m ? { label: sourceLabel(m), url: safeSourceUrl(m.source_url) } : { label: "Unknown document", url: null };
    },
    fullText,
  });

  return {
    changed,
    evidence: review.evidence,
    unsupported: review.unsupported,
    warnings: [],
    checkedSourceIds: sourceIds,
  };
}
