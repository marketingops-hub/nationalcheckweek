import type { SupabaseClient } from "@supabase/supabase-js";
import { anthropicService } from "@/lib/ai/anthropic-service";
import { fetchAllChunks } from "./chunks";
import { FIELD_LABELS, type EntityType } from "./entities";
import { reviewEvidence, type EvidenceItem } from "./evidence";
import { safeSourceUrl, sourceLabel } from "./format";
import { groupChunks, type RetrievedChunk } from "./group";
import { SYSTEM_PROMPT, buildRefillPrompt, changedFields, parseRefillOutput, type PromptDoc } from "./prompt";
import { rankChunksForText } from "./rank";
import type { PageContext, VaultMeta } from "./service";

export const REFILL_TIMEOUT_MS = 40_000;
const MAX_DOCS = 12;

export interface RefillResult {
  /** new text for the sections it could write (only valid ones) */
  content: Record<string, unknown>;
  /** the checks on that text */
  evidence: Record<string, EvidenceItem[]>;
  unsupported: Record<string, string[]>;
}

/**
 * Second pass for sections that have no valid source. For each such section it
 * searches the FULL text of the documents that were picked (not just the few
 * passages the first pass saw), asks the AI to rewrite the sections from them,
 * and checks every quote and figure. Best effort: returns null if anything
 * goes wrong, so the first draft is never lost.
 */
export async function refillWeakFields(args: {
  db: SupabaseClient;
  type: EntityType;
  ctx: PageContext;
  /** the first-pass draft */
  draft: Record<string, unknown>;
  /** the documents that were picked (found by the search, or ticked) */
  docIds: string[];
  meta: Map<string, VaultMeta>;
  weak: string[];
  reviewerChoseSources: boolean;
}): Promise<RefillResult | null> {
  try {
    const ids = [...new Set(args.docIds)].filter((id) => args.meta.has(id)).slice(0, MAX_DOCS);
    if (ids.length === 0 || args.weak.length === 0) return null;
    const titles = new Map(ids.map((id) => [id, args.meta.get(id)!.title]));

    const all = await fetchAllChunks(args.db, ids, titles);
    if (all.length === 0) return null;

    // Each weak section looks for its own passages; the union is what the AI reads.
    const picked: RetrievedChunk[] = [];
    const seen = new Set<string>();
    for (const f of args.weak) {
      const text = `${FIELD_LABELS[f] ?? f} ${args.ctx.subject} ${JSON.stringify(args.ctx.current[f] ?? "")}`;
      const groups = rankChunksForText(all, text, { preferStats: true, perDoc: 3, maxDocs: 8, maxTotalChars: 10_000 });
      for (const chunk of groups.flatMap((g) => g.chunks)) {
        const key = `${chunk.document_id}:${chunk.content.slice(0, 80)}`;
        if (!seen.has(key)) {
          seen.add(key);
          picked.push(chunk);
        }
      }
    }
    const grouped = groupChunks(picked, { maxDocs: 10, perDoc: 6, maxTotalChars: 32_000 });
    if (grouped.length === 0) return null;

    const docs: PromptDoc[] = grouped.map((g, i) => {
      const m = args.meta.get(g.document_id);
      return {
        n: i + 1,
        title: m?.title ?? g.title,
        year: m?.year == null ? null : String(m.year),
        author: m?.author ?? null,
        chunks: g.chunks.map((c) => ({ page: c.chunk_page, heading: c.chunk_heading, content: c.content })),
      };
    });

    const res = await anthropicService.generateContent(
      SYSTEM_PROMPT,
      buildRefillPrompt({
        entityType: args.type,
        subject: args.ctx.subject,
        current: args.ctx.current,
        draft: args.draft,
        fields: args.weak,
        docs,
        reviewerChoseSources: args.reviewerChoseSources,
      }),
      { model: "claude-sonnet-4-6", temperature: 0.2, maxTokens: 3500, timeout: REFILL_TIMEOUT_MS },
    );

    const parsed = parseRefillOutput(res.content, args.type, args.weak, docs.length);

    // Check the new text exactly as the first draft is checked.
    const candidate = { ...args.ctx.current, ...parsed.content };
    const changed = changedFields(args.type, args.ctx.current, candidate).filter((f) => f in parsed.content);
    const review = reviewEvidence({
      changed,
      fieldLabels: FIELD_LABELS,
      current: args.ctx.current,
      proposed: candidate,
      docs: grouped,
      raw: parsed.evidence,
      describe: (id) => {
        const m = args.meta.get(id);
        return m ? { label: sourceLabel(m), url: safeSourceUrl(m.source_url) } : { label: "Unknown document", url: null };
      },
      fullText: all.map((c) => c.content).join("\n"),
    });

    return { content: parsed.content, evidence: review.evidence, unsupported: review.unsupported };
  } catch (err) {
    console.warn("[page-refresh] second pass failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
