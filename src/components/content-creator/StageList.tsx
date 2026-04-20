"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * StageList — one list component, four pages (ideas, drafts, verified,
 * archived). Each page mounts this with a specific `stageKey` and the
 * component handles fetching, bulk selection, and row rendering.
 *
 * After the Apr 2026 refactor, the row/pill/bulk-bar/empty-state UIs live in
 * their own files:
 *   - ./DraftRow.tsx
 *   - ./BulkBar.tsx
 *   - ./pills.tsx              (StatusPill, TypePill — also used by [id]/page)
 *   - ./StageEmptyState.tsx
 *   - ./stage-config.ts        (STAGE_STATUSES, BULK_SELECTABLE)
 *
 * This file is now only responsible for:
 *   1. Fetching drafts for the current stage (parallel per-status queries).
 *   2. Bulk selection state.
 *   3. Sequential bulk-action runner that respects the AI rate limiter.
 *   4. Per-row error handling for approve / archive.
 *
 * ── Design notes ──────────────────────────────────────────────────────────
 *   - Sequential bulk: parallel AI calls would burn the 30/hr limiter and
 *     surface confusing 429s, so runBulk walks ids one at a time.
 *   - The error boundary (../../app/admin/content-creator/error.tsx)
 *     catches anything we re-throw from here.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listDrafts,
  approveIdea,
  archiveDraft,
  generateDraft,
} from "@/lib/content-creator/client";
import type { ContentDraft, ContentType } from "@/lib/content-creator/types";
import { BulkBar } from "./BulkBar";
import { DraftRow } from "./DraftRow";
import { StageEmptyState } from "./StageEmptyState";
import { STAGE_STATUSES, BULK_SELECTABLE, type StageKey } from "./stage-config";

export type { StageKey } from "./stage-config";

export function StageList({ stageKey }: { stageKey: StageKey }) {
  const [typeFilter, setTypeFilter] = useState<ContentType | 'all'>('all');
  const [drafts,  setDrafts]   = useState<ContentDraft[]>([]);
  const [loading, setLoading]  = useState(true);
  const [error,   setError]    = useState("");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState<null | { label: string; done: number; total: number }>(null);

  /* ─── Fetch ─────────────────────────────────────────────────────────── */

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const statuses = STAGE_STATUSES[stageKey];
      const results = await Promise.all(
        statuses.map((s) =>
          listDrafts({
            status:       s,
            content_type: typeFilter === 'all' ? undefined : typeFilter,
            limit:        100,
          }),
        ),
      );
      setDrafts(results.flat().sort((a, b) => b.updated_at.localeCompare(a.updated_at)));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [stageKey, typeFilter]);

  useEffect(() => { refresh(); }, [refresh]);
  // Reset selection when the user changes stage or type filter — otherwise
  // stale ids from a previous view can leak into bulk actions.
  useEffect(() => { setSelected(new Set()); }, [stageKey, typeFilter]);

  /* ─── Selection helpers ─────────────────────────────────────────────── */

  const selectableStatuses = BULK_SELECTABLE[stageKey];
  const selectableDrafts   = useMemo(
    () => drafts.filter((d) => selectableStatuses.includes(d.status)),
    [drafts, selectableStatuses],
  );
  const allSelected = selectableDrafts.length > 0
    && selectableDrafts.every((d) => selected.has(d.id));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(selectableDrafts.map((d) => d.id)));
  }
  function clearSelection() { setSelected(new Set()); }

  /* ─── Bulk runner ───────────────────────────────────────────────────── */

  /**
   * Sequential bulk runner. Parallel calls would burn the 30/hr AI limiter
   * and surface confusing 429s, so we walk the list one id at a time and
   * aggregate errors into a single banner.
   */
  async function runBulk(label: string, ids: string[], action: (id: string) => Promise<unknown>) {
    if (ids.length === 0) return;
    setError("");
    setBulkBusy({ label, done: 0, total: ids.length });
    let failed = 0;
    let firstErr = "";
    for (let i = 0; i < ids.length; i++) {
      try {
        await action(ids[i]);
      } catch (e) {
        failed += 1;
        if (!firstErr) firstErr = e instanceof Error ? e.message : String(e);
      }
      setBulkBusy({ label, done: i + 1, total: ids.length });
    }
    setBulkBusy(null);
    clearSelection();
    await refresh();
    if (failed > 0) {
      setError(`${failed}/${ids.length} ${label.toLowerCase()} failed. First error: ${firstErr}`);
    }
  }

  /* ─── Actions ───────────────────────────────────────────────────────── */

  async function onBulkApprove() {
    // Only rows currently in 'idea' status are meaningful for Approve.
    const ids = drafts.filter((d) => selected.has(d.id) && d.status === 'idea').map((d) => d.id);
    await runBulk('Approve', ids, approveIdea);
  }

  async function onBulkArchive() {
    const ids = Array.from(selected);
    if (!confirm(`Archive ${ids.length} item${ids.length === 1 ? '' : 's'}?`)) return;
    await runBulk('Archive', ids, archiveDraft);
  }

  async function onBulkGenerate() {
    const items = drafts.filter((d) => selected.has(d.id) && selectableStatuses.includes(d.status));
    if (items.length === 0) return;
    // Prompt for >3 items so the admin sees the time/cost estimate.
    const confirmed = items.length <= 3 || confirm(
      `Generate content for ${items.length} ideas? This uses the AI limiter (30 calls/hour) and may take ~${items.length * 45}s total.`,
    );
    if (!confirmed) return;
    await runBulk('Generate', items.map((d) => d.id), async (id) => {
      const d = items.find((x) => x.id === id)!;
      if (d.status === 'idea') await approveIdea(id);
      await generateDraft(id);
    });
  }

  async function onApprove(id: string) {
    try { await approveIdea(id); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }
  async function onArchive(id: string) {
    if (!confirm("Archive this draft? You can find it in the Archived stage.")) return;
    try { await archiveDraft(id); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  /* ─── Render ────────────────────────────────────────────────────────── */

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>TYPE</label>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ContentType | 'all')}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #E5E7EB', fontSize: 14 }}
        >
          <option value="all">All</option>
          <option value="social">Social</option>
          <option value="blog">Blog</option>
          <option value="newsletter">Newsletter</option>
        </select>
        <button onClick={refresh} className="swa-btn" style={{ marginLeft: 'auto', fontSize: 12, padding: '6px 10px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>refresh</span>
          Refresh
        </button>
      </div>

      {error && <div className="swa-alert swa-alert--error" style={{ marginBottom: 20 }}>{error}</div>}

      {loading ? (
        <Loading />
      ) : drafts.length === 0 ? (
        <StageEmptyState stageKey={stageKey} />
      ) : (
        <>
          {selectableDrafts.length > 0 && (
            <BulkBar
              allSelected={allSelected}
              onToggleAll={toggleSelectAll}
              bulkBusy={bulkBusy}
              selectedCount={selected.size}
              stageKey={stageKey}
              canApprove={drafts.some((d) => selected.has(d.id) && d.status === 'idea')}
              onApprove={onBulkApprove}
              onGenerate={onBulkGenerate}
              onArchive={onBulkArchive}
              onClear={clearSelection}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {drafts.map((d) => (
              <DraftRow
                key={d.id}
                draft={d}
                onApprove={onApprove}
                onArchive={onArchive}
                selectable={selectableStatuses.includes(d.status)}
                selected={selected.has(d.id)}
                onToggleSelect={() => toggleSelect(d.id)}
                disabled={!!bulkBusy}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
      <span className="material-symbols-outlined"
            style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>
        hourglass_empty
      </span>
      Loading…
    </div>
  );
}
