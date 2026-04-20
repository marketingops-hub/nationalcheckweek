"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/content-creator — pipeline dashboard.
 *
 * Tabs mirror the status column. A single list is re-queried whenever the
 * active tab changes; nothing fancier needed at the current volume.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listDrafts, approveIdea, archiveDraft, generateDraft } from "@/lib/content-creator/client";
import type { ContentDraft, ContentStatus, ContentType } from "@/lib/content-creator/types";

type TabKey = 'ideas' | 'drafts' | 'verified' | 'archived';

/** Rows in these statuses can be checkbox-selected for bulk actions. */
const SELECTABLE_STATUSES: ContentStatus[] = ['idea', 'approved_idea'];

const TABS: { key: TabKey; label: string; statuses: ContentStatus[]; icon: string }[] = [
  { key: 'ideas',    label: 'Ideas',    statuses: ['idea', 'approved_idea', 'generating'],  icon: 'lightbulb' },
  { key: 'drafts',   label: 'Drafts',   statuses: ['draft', 'verifying', 'rejected'],        icon: 'edit_note' },
  { key: 'verified', label: 'Verified', statuses: ['verified'],                              icon: 'verified' },
  { key: 'archived', label: 'Archived', statuses: ['archived'],                              icon: 'inventory_2' },
];

export default function ContentCreatorDashboard() {
  const [tab, setTab] = useState<TabKey>('ideas');
  const [typeFilter, setTypeFilter] = useState<ContentType | 'all'>('all');
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Bulk-selection state. Cleared whenever the tab/filter changes so a stale
  // selection can't leak into a different list.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState<null | { label: string; done: number; total: number }>(null);

  const refresh = useCallback(async () => {
    const activeStatuses = TABS.find((t) => t.key === tab)!.statuses;
    try {
      setLoading(true);
      // Fetch everything for this tab; a single query hits the indexed
      // content_drafts_status_idx so the "list by status" case is fast.
      const all = await Promise.all(
        activeStatuses.map((s) =>
          listDrafts({ status: s, content_type: typeFilter === 'all' ? undefined : typeFilter, limit: 100 }),
        ),
      );
      setDrafts(all.flat().sort((a, b) => b.updated_at.localeCompare(a.updated_at)));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [tab, typeFilter]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { setSelected(new Set()); }, [tab, typeFilter]);

  const selectableDrafts = useMemo(
    () => drafts.filter((d) => SELECTABLE_STATUSES.includes(d.status)),
    [drafts],
  );
  const allSelected = selectableDrafts.length > 0 && selectableDrafts.every((d) => selected.has(d.id));

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

  /**
   * Run an async action against each selected id sequentially. Sequential (not
   * parallel) because the edge function is AI-heavy and shares a 30/hr budget;
   * parallel fire would burn the limiter and surface confusing 429s.
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
    if (failed > 0) setError(`${failed}/${ids.length} ${label.toLowerCase()} failed. First error: ${firstErr}`);
  }

  async function onBulkApprove() {
    const ids = drafts.filter((d) => selected.has(d.id) && d.status === 'idea').map((d) => d.id);
    await runBulk('Approve', ids, approveIdea);
  }

  async function onBulkArchive() {
    const ids = Array.from(selected);
    if (!confirm(`Archive ${ids.length} item${ids.length === 1 ? '' : 's'}?`)) return;
    await runBulk('Archive', ids, archiveDraft);
  }

  /**
   * Approve-then-generate pipeline. Each idea is:
   *   1. approveIdea      (idea → approved_idea)
   *   2. generateDraft    (approved_idea → draft)
   * Already-approved items skip step 1. Sequential to respect the AI limiter.
   */
  async function onBulkGenerate() {
    const items = drafts.filter((d) => selected.has(d.id) && SELECTABLE_STATUSES.includes(d.status));
    if (items.length === 0) return;
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
    try {
      await approveIdea(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onArchive(id: string) {
    if (!confirm("Archive this draft? You can find it in the Archived tab.")) return;
    try {
      await archiveDraft(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Content Creator</h1>
          <p className="swa-page-subtitle">
            Generate social posts, blog posts and newsletters grounded in the Vault. Every draft is verified against Vault entries before it reaches the team.
          </p>
        </div>
        <Link href="/admin/content-creator/new" className="swa-btn swa-btn--primary">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          New Brief
        </Link>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #E5E7EB', marginBottom: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="swa-icon-btn"
            style={{
              padding: '10px 16px',
              borderRadius: 0,
              borderBottom: tab === t.key ? '2px solid #1E1040' : '2px solid transparent',
              color: tab === t.key ? '#1E1040' : '#6B7280',
              fontWeight: tab === t.key ? 700 : 500,
              background: 'transparent',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
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
        </div>
      </div>

      {error && <div className="swa-alert swa-alert--error" style={{ marginBottom: 20 }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>hourglass_empty</span>
          Loading…
        </div>
      ) : drafts.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <>
          {selectableDrafts.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
              background: selected.size > 0 ? '#EEF2FF' : '#F9FAFB',
              border: '1px solid ' + (selected.size > 0 ? '#C7D2FE' : '#E5E7EB'),
              borderRadius: 10, marginBottom: 10, fontSize: 13,
            }}>
              <input
                type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                disabled={!!bulkBusy}
                title={allSelected ? 'Clear selection' : 'Select all'}
                style={{ cursor: bulkBusy ? 'wait' : 'pointer' }}
              />
              {selected.size === 0 ? (
                <span style={{ color: '#6B7280' }}>Select ideas to approve or generate in bulk.</span>
              ) : (
                <>
                  <span style={{ fontWeight: 600, color: '#1E1040' }}>
                    {selected.size} selected
                  </span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                    {bulkBusy ? (
                      <span style={{ color: '#4338CA', fontWeight: 600 }}>
                        {bulkBusy.label} {bulkBusy.done}/{bulkBusy.total}…
                      </span>
                    ) : (
                      <>
                        <button onClick={onBulkApprove} className="swa-btn" style={{ fontSize: 12, padding: '6px 12px' }}
                          disabled={!drafts.some((d) => selected.has(d.id) && d.status === 'idea')}>
                          Approve
                        </button>
                        <button onClick={onBulkGenerate} className="swa-btn swa-btn--primary" style={{ fontSize: 12, padding: '6px 12px' }}>
                          Approve &amp; Generate
                        </button>
                        <button onClick={onBulkArchive} className="swa-btn" style={{ fontSize: 12, padding: '6px 12px', color: '#B91C1C' }}>
                          Archive
                        </button>
                        <button onClick={clearSelection} className="swa-icon-btn" title="Clear selection">
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {drafts.map((d) => (
              <DraftRow
                key={d.id}
                draft={d}
                onApprove={onApprove}
                onArchive={onArchive}
                selectable={SELECTABLE_STATUSES.includes(d.status)}
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

/* ─── Row ────────────────────────────────────────────────────────────────── */

function DraftRow({
  draft,
  onApprove,
  onArchive,
  selectable,
  selected,
  onToggleSelect,
  disabled,
}: {
  draft: ContentDraft;
  onApprove: (id: string) => void;
  onArchive: (id: string) => void;
  selectable: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  disabled: boolean;
}) {
  const title = draft.title ?? (draft.body.slice(0, 80) + (draft.body.length > 80 ? '…' : ''));
  const isGenerating = draft.status === 'generating' || draft.status === 'verifying';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: selected ? '#F5F3FF' : '#fff',
        border: '1px solid ' + (selected ? '#C4B5FD' : '#E5E7EB'),
        borderRadius: 12,
        padding: '14px 18px',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {selectable ? (
        <input
          type="checkbox" checked={selected} onChange={onToggleSelect} disabled={disabled}
          style={{ cursor: disabled ? 'wait' : 'pointer', flexShrink: 0 }}
        />
      ) : (
        <span style={{ width: 13, flexShrink: 0 }} />
      )}
      <StatusPill status={draft.status} />
      <TypePill type={draft.content_type} platform={draft.platform} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: '#1E1040', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title || '(untitled)'}
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>
          {draft.brief.topic && <>topic: {draft.brief.topic}</>}
          <span> · updated {new Date(draft.updated_at).toLocaleString()}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {draft.status === 'idea' && (
          <button onClick={() => onApprove(draft.id)} className="swa-btn swa-btn--primary" style={{ fontSize: 13, padding: '6px 12px' }}>
            Approve
          </button>
        )}
        <Link
          href={`/admin/content-creator/${draft.id}`}
          className="swa-icon-btn"
          title={isGenerating ? 'In progress…' : 'Open'}
          style={isGenerating ? { opacity: 0.5 } : undefined}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>open_in_new</span>
        </Link>
        {draft.status !== 'archived' && (
          <button onClick={() => onArchive(draft.id)} className="swa-icon-btn" title="Archive" style={{ color: '#EF4444' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>archive</span>
          </button>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: ContentStatus }) {
  const map: Record<ContentStatus, { bg: string; color: string; label: string }> = {
    idea:          { bg: '#FEF3C7', color: '#B45309', label: 'Idea' },
    approved_idea: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Approved' },
    generating:    { bg: '#E0E7FF', color: '#4338CA', label: 'Generating…' },
    draft:         { bg: '#F3F4F6', color: '#374151', label: 'Draft' },
    verifying:     { bg: '#E0E7FF', color: '#4338CA', label: 'Verifying…' },
    verified:      { bg: '#D1FAE5', color: '#047857', label: 'Verified ✓' },
    rejected:      { bg: '#FEE2E2', color: '#B91C1C', label: 'Rejected' },
    archived:      { bg: '#F3F4F6', color: '#6B7280', label: 'Archived' },
  };
  const m = map[status];
  return (
    <span style={{ background: m.bg, color: m.color, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 }}>
      {m.label}
    </span>
  );
}

function TypePill({ type, platform }: { type: ContentType; platform: string | null }) {
  const label = type === 'social' ? `Social · ${platform ?? '?'}` : type.charAt(0).toUpperCase() + type.slice(1);
  return (
    <span style={{ background: '#1E1040', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 4, flexShrink: 0 }}>
      {label}
    </span>
  );
}

function EmptyState({ tab }: { tab: TabKey }) {
  const msg: Record<TabKey, { icon: string; title: string; hint: string }> = {
    ideas:    { icon: 'lightbulb',   title: 'No ideas yet',           hint: 'Start a New Brief to generate 5 ideas grounded in the Vault.' },
    drafts:   { icon: 'edit_note',   title: 'No drafts in progress',  hint: 'Approve an idea to produce a full draft.' },
    verified: { icon: 'verified',    title: 'Nothing verified yet',   hint: 'Run Verify on a draft to check every claim against the Vault.' },
    archived: { icon: 'inventory_2', title: 'Archive is empty',       hint: 'Archived drafts appear here.' },
  };
  const m = msg[tab];
  return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>{m.icon}</span>
      <h3 style={{ color: '#1E1040', marginBottom: 8 }}>{m.title}</h3>
      <p style={{ marginBottom: 20 }}>{m.hint}</p>
      {tab === 'ideas' && (
        <Link href="/admin/content-creator/new" className="swa-btn swa-btn--primary">Start a brief</Link>
      )}
    </div>
  );
}
