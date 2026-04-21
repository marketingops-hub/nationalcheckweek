"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * useContentLibrary — data + selection state for the Content Library grid.
 *
 * Covers both /library and /drafts (the redesigned drafts page is just
 * /library preset to tab='drafts').
 *
 * Responsibilities:
 *   - Fetch drafts for the current tab (parallel per-status queries, since
 *     the /api/admin/content-creator list endpoint takes a single status).
 *   - Fetch per-status counts once for the tab badges.
 *   - Local filtering by type + case-insensitive text query.
 *   - Selection set + row-level + bulk archive/unarchive/delete.
 *   - Copy-body helper that toasts via the parent's error channel when the
 *     clipboard API is unavailable.
 *
 * NOT responsible for:
 *   - AI actions (no approve/generate here — the library deliberately sits
 *     "downstream" of idea generation).
 *   - Per-row save/verify flows (those live on /[id]).
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listDrafts, archiveDraft, deleteDraft, getStats,
} from "@/lib/content-creator/client";
import type { ContentDraft, ContentStatus, ContentType } from "@/lib/content-creator/types";
import type { LibraryTab } from "../_components/LibraryToolbar";

/** DB statuses that roll up into each library tab. */
export const TAB_STATUSES: Record<LibraryTab, ContentStatus[]> = {
  // "All created" intentionally excludes idea/approved_idea (those live on
  // the Ideas page) and archived (its own tab). `generating` and `verifying`
  // are included so the user can SEE a freshly-started run appear in their
  // library, not wonder where it went.
  all:      ['generating', 'draft', 'verifying', 'rejected', 'verified'],
  drafts:   ['draft', 'verifying', 'rejected'],
  verified: ['verified'],
  rejected: ['rejected'],
  archived: ['archived'],
};

export interface UseContentLibraryOpts {
  /** Initial tab. Drafts page passes 'drafts'; /library defaults to 'all'. */
  initialTab?: LibraryTab;
}

export function useContentLibrary({ initialTab = 'all' }: UseContentLibraryOpts = {}) {
  const [tab,        setTab]        = useState<LibraryTab>(initialTab);
  const [typeFilter, setTypeFilter] = useState<ContentType | 'all'>('all');
  const [query,      setQuery]      = useState<string>("");

  const [drafts,   setDrafts]   = useState<ContentDraft[]>([]);
  const [counts,   setCounts]   = useState<Partial<Record<LibraryTab, number>>>({});
  const [loading,  setLoading]  = useState<boolean>(true);
  const [error,    setError]    = useState<string>("");
  const [info,     setInfo]     = useState<string>("");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState<null | { label: string; done: number; total: number }>(null);

  /* ─── Fetch: drafts for tab ────────────────────────────────────────────── */

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const statuses = TAB_STATUSES[tab];
      const pages = await Promise.all(
        statuses.map((s) =>
          listDrafts({
            status:       s,
            content_type: typeFilter === 'all' ? undefined : typeFilter,
            limit:        100,
          }),
        ),
      );
      const flat = pages.flat()
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      setDrafts(flat);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [tab, typeFilter]);

  useEffect(() => { refresh(); }, [refresh]);
  // Reset selection + one-shot info banner on tab/type changes to avoid
  // stale ids leaking into bulk ops.
  useEffect(() => { setSelected(new Set()); setInfo(""); }, [tab, typeFilter]);

  /* ─── Fetch: per-tab counts (once, then on explicit refresh) ──────────── */

  const refreshCounts = useCallback(async () => {
    try {
      const c = await getStats();
      const byTab: Partial<Record<LibraryTab, number>> = {};
      (Object.keys(TAB_STATUSES) as LibraryTab[]).forEach((t) => {
        byTab[t] = TAB_STATUSES[t].reduce((sum, s) => sum + (c[s] ?? 0), 0);
      });
      setCounts(byTab);
    } catch {
      // Non-critical — badges just stay blank.
    }
  }, []);
  useEffect(() => { refreshCounts(); }, [refreshCounts]);

  /* ─── Client-side text filter ─────────────────────────────────────────── */

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return drafts;
    return drafts.filter((d) => {
      const hay = [
        d.title ?? '',
        typeof d.body === 'string' ? d.body : '',
        d.brief?.topic ?? '',
        (d.brief?.keywords ?? []).join(' '),
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [drafts, query]);

  /* ─── Selection ───────────────────────────────────────────────────────── */

  const selectable = filtered.filter(
    (d) => d.status !== 'generating' && d.status !== 'verifying',
  );
  const allSelected = selectable.length > 0 && selectable.every((d) => selected.has(d.id));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(selectable.map((d) => d.id)));
  }
  function clearSelection() { setSelected(new Set()); }

  /* ─── Bulk runner ─────────────────────────────────────────────────────── */

  async function runBulk(label: string, ids: string[], fn: (id: string) => Promise<unknown>) {
    if (ids.length === 0) return;
    setError(""); setInfo("");
    setBulkBusy({ label, done: 0, total: ids.length });
    let failed = 0; let firstErr = "";
    for (let i = 0; i < ids.length; i++) {
      try { await fn(ids[i]); }
      catch (e) { failed += 1; if (!firstErr) firstErr = e instanceof Error ? e.message : String(e); }
      setBulkBusy({ label, done: i + 1, total: ids.length });
    }
    setBulkBusy(null); clearSelection();
    await Promise.all([refresh(), refreshCounts()]);
    if (failed > 0) {
      setError(`${failed}/${ids.length} ${label.toLowerCase()} failed. First error: ${firstErr}`);
    } else {
      setInfo(`${label} ${ids.length} item${ids.length === 1 ? '' : 's'}.`);
    }
  }

  /* ─── Row actions ─────────────────────────────────────────────────────── */

  async function onArchive(id: string) {
    if (!confirm("Archive this item? You can find it in the Archived tab.")) return;
    try { await archiveDraft(id); await Promise.all([refresh(), refreshCounts()]); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }
  async function onDelete(id: string) {
    if (!confirm("Delete permanently? This cannot be undone.")) return;
    try { await deleteDraft(id); await Promise.all([refresh(), refreshCounts()]); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  async function onCopyBody(id: string) {
    const d = drafts.find((x) => x.id === id);
    const body = d && typeof d.body === 'string' ? d.body : '';
    if (!body) { setError("This item has no body to copy yet."); return; }
    try {
      await navigator.clipboard.writeText(body);
      setInfo("Copied body to clipboard.");
    } catch {
      setError("Couldn't access the clipboard. Try selecting the text manually.");
    }
  }

  /* ─── Bulk actions ────────────────────────────────────────────────────── */

  async function onBulkArchive() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!confirm(`Archive ${ids.length} item${ids.length === 1 ? '' : 's'}?`)) return;
    await runBulk('Archived', ids, archiveDraft);
  }
  async function onBulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} item${ids.length === 1 ? '' : 's'} permanently? This cannot be undone.`)) return;
    await runBulk('Deleted', ids, deleteDraft);
  }

  /* ─── Reset helpers ───────────────────────────────────────────────────── */

  function clearFilters() {
    setTypeFilter('all');
    setQuery("");
    setTab('all');
  }

  return {
    // state
    tab, setTab,
    typeFilter, setTypeFilter,
    query, setQuery,
    drafts: filtered,
    counts,
    loading, error, info,
    selected, allSelected, bulkBusy,
    // row actions
    toggleSelect, toggleSelectAll, clearSelection,
    onArchive, onDelete, onCopyBody,
    // bulk actions
    onBulkArchive, onBulkDelete,
    // utilities
    refresh, clearFilters,
  };
}
