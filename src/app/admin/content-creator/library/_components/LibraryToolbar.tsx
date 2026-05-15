"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * LibraryToolbar — filters for the Content Library grid.
 *
 * Three controls, left → right:
 *   1. Status tabs           (All · Drafts · Verified · Rejected · Archived)
 *   2. Type select           (All · Blog · Newsletter · Social)
 *   3. Search input          (debounced-by-parent; client-side title/body match)
 *
 * `All` tab resolves to {draft, verifying, rejected, verified} — the set of
 * statuses that represent actually-produced content. Ideas get their own
 * page (/admin/content-creator/ideas) and are NOT duplicated here, because
 * the user's mental model is "my written articles", not "everything in the
 * pipeline". Archived is its own tab so the list is clean by default but
 * still reachable in one click.
 *
 * Counts per tab come from `counts` prop; the parent calls `getStats()`
 * once on mount and passes exact per-status totals down. Badges are
 * hidden when count=0 to keep the bar quiet on fresh installs.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { ContentType } from "@/lib/content-creator/types";

export type LibraryTab = 'all' | 'drafts' | 'verified' | 'rejected' | 'archived';

export const TAB_ORDER: LibraryTab[] = ['all', 'drafts', 'verified', 'rejected', 'archived'];

export interface LibraryToolbarProps {
  tab:         LibraryTab;
  onTab:       (t: LibraryTab) => void;
  typeFilter:  ContentType | 'all';
  onTypeFilter: (t: ContentType | 'all') => void;
  query:       string;
  onQuery:     (q: string) => void;
  /** Per-tab counts from getStats. Missing keys render as no badge. */
  counts:      Partial<Record<LibraryTab, number>>;
  onRefresh:   () => void;
  loading:     boolean;
}

export function LibraryToolbar({
  tab, onTab, typeFilter, onTypeFilter,
  query, onQuery, counts, onRefresh, loading,
}: LibraryToolbarProps) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        marginBottom: 16, padding: '10px 12px',
        background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
      }}
    >
      {/* Status tabs */}
      <div style={{ display: 'inline-flex', background: '#F3F4F6', borderRadius: 10, padding: 3, gap: 2 }}>
        {TAB_ORDER.map((t) => {
          const active = t === tab;
          const count  = counts[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => onTab(t)}
              style={{
                padding: '6px 12px',
                border: 'none', borderRadius: 8,
                background: active ? '#fff'     : 'transparent',
                color:      active ? '#1E1040' : '#6B7280',
                fontSize: 12, fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                boxShadow: active ? '0 1px 2px rgba(16,24,40,0.08)' : undefined,
                textTransform: 'capitalize',
              }}
              aria-pressed={active}
            >
              {TAB_LABELS[t]}
              {typeof count === 'number' && count > 0 && (
                <span
                  style={{
                    fontSize: 10, fontWeight: 700,
                    padding: '1px 6px', borderRadius: 999,
                    background: active ? '#EDE9FE' : '#E5E7EB',
                    color:      active ? '#5925F4' : '#6B7280',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Type filter */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Type
        </span>
        <select
          value={typeFilter}
          onChange={(e) => onTypeFilter(e.target.value as ContentType | 'all')}
          style={{
            padding: '6px 10px', borderRadius: 8,
            border: '1px solid #D1D5DB', fontSize: 13,
            background: '#fff', color: '#1E1040', cursor: 'pointer',
          }}
        >
          <option value="all">All</option>
          <option value="blog">Blog</option>
          <option value="newsletter">Newsletter</option>
          <option value="social">Social</option>
        </select>
      </div>

      {/* Search */}
      <div
        style={{
          flex: '1 1 260px', minWidth: 200, display: 'inline-flex',
          alignItems: 'center', gap: 6,
          border: '1px solid #D1D5DB', borderRadius: 8, padding: '0 10px',
          background: '#fff',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#9CA3AF' }}>
          search
        </span>
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search titles, topics, body…"
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            padding: '8px 0', fontSize: 13, color: '#1E1040',
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => onQuery("")}
            aria-label="Clear search"
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              color: '#9CA3AF', fontSize: 18, lineHeight: 1, padding: 0,
            }}
          >
            ×
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="swa-btn"
        style={{ fontSize: 12, padding: '6px 10px' }}
        title="Refresh list"
      >
        <span
          className={`material-symbols-outlined${loading ? ' swa-spin' : ''}`}
          style={{ fontSize: 14 }}
        >
          refresh
        </span>
        Refresh
      </button>

    </div>
  );
}

const TAB_LABELS: Record<LibraryTab, string> = {
  all:      'All created',
  drafts:   'Drafts',
  verified: 'Verified',
  rejected: 'Rejected',
  archived: 'Archived',
};
