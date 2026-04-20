/* ═══════════════════════════════════════════════════════════════════════════
 * Stage configuration — the single source of truth for which draft statuses
 * belong to which pipeline page, and which of those statuses permit bulk
 * selection.
 *
 * Extracted out of `StageList.tsx` so `BulkBar`, `EmptyState`, and any
 * future stage-aware component can share the same definitions without
 * import loops.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { ContentStatus } from "@/lib/content-creator/types";

/** One of the four per-URL pipeline pages. */
export type StageKey = 'ideas' | 'drafts' | 'verified' | 'archived';

/**
 * DB statuses that show up on each stage page. A draft with status
 * `generating` lives on the ideas page (because it just moved off the
 * approved-idea board); `verifying` lives on drafts; etc.
 */
export const STAGE_STATUSES: Record<StageKey, ContentStatus[]> = {
  ideas:    ['idea', 'approved_idea', 'generating'],
  drafts:   ['draft', 'verifying', 'rejected'],
  verified: ['verified'],
  archived: ['archived'],
};

/**
 * Statuses that are eligible for bulk action on each page. A row in
 * `generating` can't be bulk-selected because there's no meaningful bulk
 * operation for mid-flight rows.
 */
export const BULK_SELECTABLE: Record<StageKey, ContentStatus[]> = {
  ideas:    ['idea', 'approved_idea'],
  drafts:   ['draft', 'rejected'],
  verified: [],
  archived: [],
};
