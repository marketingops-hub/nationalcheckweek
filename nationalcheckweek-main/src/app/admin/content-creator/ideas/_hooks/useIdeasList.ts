"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * useIdeasList — all data + actions for the Ideas stage.
 *
 * Ideas-specific scope (not reusable for drafts/verified/archived):
 *   - Fetches statuses: idea, approved_idea, generating
 *   - Exposes per-status counts for the tab strip
 *   - Filters bulk-selection to *only* idea + approved_idea rows
 *     (a row mid-generation has no sensible bulk action)
 *   - Sequential bulk runner respects the 30/hr AI rate limiter
 *
 * Split out of page.tsx so the UI components stay presentational and the
 * fetch/mutate logic is independently testable.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listDrafts,
  approveIdea,
  unapproveIdea,
  archiveDraft,
  deleteDraft,
  generateDraft,
  patchDraft,
  recoverStuckDraft,
} from "@/lib/content-creator/client";
import type { ContentDraft, ContentType, ContentStatus, SocialPlatform } from "@/lib/content-creator/types";

/** Payload posted by the "Generate options" modal. Any field equal to the
 *  current draft value is skipped in the PATCH to keep the update minimal. */
export interface GenerateWithOptionsInput {
  content_type:  ContentType;
  platform:      SocialPlatform | null;
  length_preset: 'short' | 'standard' | 'long';
  style_id:      string | null;
}

/**
 * Pure helper: compute the minimal `patchDraft` payload needed to make
 * `current` match `opts`. Returns `null` when the two are already
 * equivalent and no PATCH is required.
 *
 * Kept pure (no hook state, no imports from client.ts beyond the type)
 * so the diff rules are unit-testable without React or network mocks.
 * Exported for tests and reused from `generateWithOptions` below.
 */
export function diffGenerateOptions(
  current: Pick<ContentDraft, 'content_type' | 'platform' | 'brief'>,
  opts:    GenerateWithOptionsInput,
): Parameters<typeof patchDraft>[1] | null {
  const patch: Parameters<typeof patchDraft>[1] = {};
  if (opts.content_type !== current.content_type) {
    patch.content_type = opts.content_type;
  }
  if ((opts.platform ?? null) !== (current.platform ?? null)) {
    patch.platform = opts.platform;
  }

  const briefPatch: NonNullable<typeof patch.brief_patch> = {};
  const currentStyleId = current.brief?.style_id ?? null;
  if (opts.style_id !== currentStyleId) {
    // Explicit unset goes through as style_id: null — the PATCH route
    // deletes nulled keys from the merged brief, so a cleared style
    // doesn't leave a dangling id the edge fn then has to step around.
    briefPatch.style_id = opts.style_id;
  }
  // 'standard' is the stored default. Treat a missing field as standard
  // so switching FROM standard to standard is always a no-op.
  const currentPreset = current.brief?.length_preset ?? 'standard';
  if (opts.length_preset !== currentPreset) {
    briefPatch.length_preset = opts.length_preset;
  }
  if (Object.keys(briefPatch).length > 0) {
    patch.brief_patch = briefPatch;
  }

  return Object.keys(patch).length === 0 ? null : patch;
}

/** Statuses that belong to this stage. Ordered so `generating` rows are
 *  visible but visually de-emphasised at the bottom. */
const IDEAS_STATUSES: ContentStatus[] = ['idea', 'approved_idea', 'generating'];

/** Statuses that may participate in a bulk action. A row mid-generation
 *  has no sensible bulk op so we silently exclude it. */
const BULK_ELIGIBLE: ContentStatus[] = ['idea', 'approved_idea'];

/** Visible progress string while the sequential bulk runner is in flight. */
export interface BulkProgress { label: string; done: number; total: number }

export interface UseIdeasList {
  /** All rows for the current filters, newest first. */
  ideas:    ContentDraft[];
  counts:   Record<ContentStatus, number>;
  loading:  boolean;
  error:    string;

  typeFilter: ContentType | 'all';
  setTypeFilter: (t: ContentType | 'all') => void;

  statusFilter: ContentStatus | 'all';
  setStatusFilter: (s: ContentStatus | 'all') => void;

  /** Ids that are currently selected for a bulk action. */
  selected: Set<string>;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  selectAllVisible: () => void;
  allVisibleSelected: boolean;

  /** True when at least one selected row is eligible to approve. */
  canApproveSelected: boolean;

  bulkBusy: BulkProgress | null;
  bulkApprove:  () => Promise<void>;
  bulkGenerate: () => Promise<void>;
  bulkArchive:  () => Promise<void>;

  refresh:     () => Promise<void>;
  onApprove:   (id: string) => Promise<void>;
  onUnapprove: (id: string) => Promise<void>;
  onGenerate:  (id: string) => Promise<void>;
  onArchive:   (id: string) => Promise<void>;
  onDelete:    (id: string) => Promise<void>;
  /** Unstick a row the edge fn stranded in 'generating'. Server-side
   *  /recover enforces a 5-min minimum age so this can't race a real
   *  in-flight request. On too-early clicks we surface the wait-time
   *  hint in `error`. */
  onRecover:   (id: string) => Promise<void>;
  /** Single-row variant used by the "Generate options" modal. Diffs the
   *  payload against the idea, PATCHes only what changed, flips idea →
   *  approved_idea if needed, then fires the generate edge fn. Errors
   *  bubble to `error`. */
  generateWithOptions: (id: string, opts: GenerateWithOptionsInput) => Promise<void>;
}

export function useIdeasList(): UseIdeasList {
  const [ideas,    setIdeas]    = useState<ContentDraft[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState<BulkProgress | null>(null);

  const [typeFilter,   setTypeFilter]   = useState<ContentType   | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | 'all'>('all');

  /* ─── Fetch ─────────────────────────────────────────────────────────── */

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      // Parallel per-status queries keep the UI responsive even when the
      // `generating` table has lots of rows sitting stale from failed runs.
      const statuses = statusFilter === 'all' ? IDEAS_STATUSES : [statusFilter];
      const results  = await Promise.all(
        statuses.map((s) =>
          listDrafts({
            status:       s,
            content_type: typeFilter === 'all' ? undefined : typeFilter,
            limit:        100,
          }),
        ),
      );
      setIdeas(results.flat().sort((a, b) => b.updated_at.localeCompare(a.updated_at)));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => { refresh(); }, [refresh]);
  // Reset selection when filters change — stale ids must never leak
  // into a bulk action after the user switches views.
  useEffect(() => { setSelected(new Set()); }, [typeFilter, statusFilter]);

  /* ─── Counts per status (drives tab strip) ──────────────────────────── */

  const counts = useMemo(() => {
    const zero: Record<ContentStatus, number> = {
      idea: 0, approved_idea: 0, generating: 0,
      draft: 0, verifying: 0, verified: 0, rejected: 0, archived: 0,
    };
    for (const d of ideas) zero[d.status] = (zero[d.status] ?? 0) + 1;
    return zero;
  }, [ideas]);

  /* ─── Selection ─────────────────────────────────────────────────────── */

  const bulkEligible = useMemo(
    () => ideas.filter((d) => BULK_ELIGIBLE.includes(d.status)),
    [ideas],
  );

  const allVisibleSelected = bulkEligible.length > 0
    && bulkEligible.every((d) => selected.has(d.id));

  const canApproveSelected = useMemo(
    () => ideas.some((d) => selected.has(d.id) && d.status === 'idea'),
    [ideas, selected],
  );

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const selectAllVisible = useCallback(() => {
    setSelected((prev) => {
      if (bulkEligible.every((d) => prev.has(d.id))) return new Set();
      return new Set(bulkEligible.map((d) => d.id));
    });
  }, [bulkEligible]);

  /* ─── Row actions ───────────────────────────────────────────────────── */

  async function onApprove(id: string) {
    try {
      const updated = await approveIdea(id);
      setIdeas((rows) => rows.map((r) => (r.id === id ? updated : r)));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  async function onUnapprove(id: string) {
    try {
      const updated = await unapproveIdea(id);
      setIdeas((rows) => rows.map((r) => (r.id === id ? updated : r)));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  async function onGenerate(id: string) {
    try {
      // Kick off the edge fn — the row flips to `generating` which moves
      // it to the detail page's poll loop. List just shows a spinner chip.
      await generateDraft(id);
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  async function onArchive(id: string) {
    if (!confirm("Archive this idea? You can find it later under Archived.")) return;
    try {
      await archiveDraft(id);
      setIdeas((rows) => rows.filter((r) => r.id !== id));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this idea permanently? Use Archive to keep an audit trail.")) return;
    try {
      await deleteDraft(id);
      setIdeas((rows) => rows.filter((r) => r.id !== id));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  /* Unstick a row stranded in 'generating'. The server enforces the
   * 5-min minimum stuck age so a race with a live request is impossible
   * — we just surface the 409 wait-time hint in place of an error
   * message when it fires. On success the row transitions to
   * 'approved_idea' (no body produced) or 'draft' (body present from a
   * regen) and a full refresh pulls it back into the list correctly. */
  async function onRecover(id: string) {
    try {
      const { recovered_from, recovered_to } = await recoverStuckDraft(id);
      await refresh();
      setError(`Recovered: ${recovered_from} → ${recovered_to}. You can retry now.`);
      // Clear the "toast" after a few seconds so it doesn't linger.
      window.setTimeout(() => setError(""), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  /* ─── Generate with options (from the modal) ─────────────────────────── */

  async function generateWithOptions(id: string, opts: GenerateWithOptionsInput) {
    setError("");
    try {
      const current = ideas.find((r) => r.id === id);
      if (!current) throw new Error("Idea not found in local state — refresh and try again.");

      /* 1. Diff payload → minimal patch. diffGenerateOptions is a pure
       *    helper (see top of file) with its own unit-test coverage. */
      const patch = diffGenerateOptions(current, opts);
      if (patch) await patchDraft(id, patch);

      /* 2. Approve if still an idea, then generate. */
      if (current.status === 'idea') {
        await approveIdea(id);
      }
      await generateDraft(id);

      /* 3. Refresh once — the just-generated row is now at status=draft
       *    which moves it off this page's list, which is the right signal
       *    that the work succeeded. */
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      // Re-throw so the modal can keep itself open on failure.
      throw e;
    }
  }

  /* ─── Bulk actions ──────────────────────────────────────────────────── */

  /**
   * Walk the selected ids one at a time. Parallel runs would burn the
   * 30/hr AI rate limiter and surface confusing 429s. Errors on individual
   * rows are logged but don't abort the batch — the admin sees the count
   * of completed vs total.
   */
  async function runBulk(
    label: string,
    ids: string[],
    fn: (id: string) => Promise<unknown>,
  ) {
    if (ids.length === 0) return;
    setBulkBusy({ label, done: 0, total: ids.length });
    for (let i = 0; i < ids.length; i++) {
      try { await fn(ids[i]); }
      catch (e) { console.error(`[bulk ${label}]`, ids[i], e); }
      setBulkBusy({ label, done: i + 1, total: ids.length });
    }
    setBulkBusy(null);
    setSelected(new Set());
    await refresh();
  }

  async function bulkApprove() {
    const ids = ideas
      .filter((d) => selected.has(d.id) && d.status === 'idea')
      .map((d) => d.id);
    await runBulk('Approving', ids, approveIdea);
  }

  async function bulkGenerate() {
    const toApprove = ideas
      .filter((d) => selected.has(d.id) && d.status === 'idea')
      .map((d) => d.id);
    if (toApprove.length > 0) await runBulk('Approving', toApprove, approveIdea);

    const toGenerate = ideas
      .filter((d) => selected.has(d.id) && (d.status === 'idea' || d.status === 'approved_idea'))
      .map((d) => d.id);
    await runBulk('Generating', toGenerate, generateDraft);
  }

  async function bulkArchive() {
    const ids = Array.from(selected);
    await runBulk('Archiving', ids, archiveDraft);
  }

  return {
    ideas, counts, loading, error,
    typeFilter, setTypeFilter,
    statusFilter, setStatusFilter,
    selected, toggleSelect, clearSelection, selectAllVisible, allVisibleSelected,
    canApproveSelected,
    bulkBusy, bulkApprove, bulkGenerate, bulkArchive,
    refresh, onApprove, onUnapprove, onGenerate, onArchive, onDelete, onRecover,
    generateWithOptions,
  };
}
