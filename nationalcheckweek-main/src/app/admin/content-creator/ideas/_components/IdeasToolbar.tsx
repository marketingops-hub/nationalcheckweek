"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * IdeasToolbar — filter bar that sits under the page header.
 *
 * Left side: status tabs (All · Idea · Approved · Generating) with counts.
 * Right side: type dropdown, refresh button, count summary.
 *
 * We expose both a status tab strip AND a type dropdown rather than a
 * single combined filter because admins typically filter by status
 * (workflow) OR by content type (campaign context) but rarely both.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { ContentStatus, ContentType } from "@/lib/content-creator/types";

export interface IdeasToolbarProps {
  statusFilter:    ContentStatus | 'all';
  onStatusChange:  (s: ContentStatus | 'all') => void;
  counts:          Record<ContentStatus, number>;

  typeFilter:      ContentType | 'all';
  onTypeChange:    (t: ContentType | 'all') => void;

  totalShowing:    number;
  loading:         boolean;
  onRefresh:       () => void;
}

/** Tabs shown in order; counts come from the hook. */
const STATUS_TABS: { key: ContentStatus | 'all'; label: string }[] = [
  { key: 'all',           label: 'All' },
  { key: 'idea',          label: 'Idea' },
  { key: 'approved_idea', label: 'Approved' },
  { key: 'generating',    label: 'Generating' },
];

export function IdeasToolbar(props: IdeasToolbarProps) {
  const {
    statusFilter, onStatusChange, counts,
    typeFilter,   onTypeChange,
    totalShowing, loading, onRefresh,
  } = props;

  const totalInStage = counts.idea + counts.approved_idea + counts.generating;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      padding: '12px 0 16px',
      borderBottom: '1px solid #E5E7EB',
      marginBottom: 20,
    }}>
      {/* Status tab strip */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {STATUS_TABS.map((t) => {
          const count = t.key === 'all'
            ? totalInStage
            : (counts[t.key as ContentStatus] ?? 0);
          const active = statusFilter === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onStatusChange(t.key)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid',
                borderColor:  active ? '#5925F4' : '#E5E7EB',
                background:   active ? '#5925F4' : '#fff',
                color:        active ? '#fff'    : '#374151',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background 120ms ease, color 120ms ease',
              }}
            >
              {t.label}
              <span style={{
                fontSize: 11, fontWeight: 700,
                padding: '1px 6px', borderRadius: 10,
                background: active ? 'rgba(255,255,255,0.25)' : '#F3F4F6',
                color:      active ? '#fff' : '#6B7280',
                minWidth: 18, textAlign: 'center',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Type dropdown */}
      <label style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 12, color: '#6B7280',
      }}>
        <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Type
        </span>
        <select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value as ContentType | 'all')}
          style={{
            padding: '6px 10px', borderRadius: 8, border: '1px solid #D1D5DB',
            fontSize: 13, background: '#fff', color: '#1E1040', cursor: 'pointer',
          }}
        >
          <option value="all">All types</option>
          <option value="social">Social</option>
          <option value="blog">Blog</option>
          <option value="newsletter">Newsletter</option>
        </select>
      </label>

      {/* Right side — count summary + refresh */}
      <div style={{
        marginLeft: 'auto',
        display: 'inline-flex', alignItems: 'center', gap: 10,
        fontSize: 12, color: '#6B7280',
      }}>
        <span>
          Showing <strong style={{ color: '#1E1040' }}>{totalShowing}</strong>
          {totalShowing === 1 ? ' idea' : ' ideas'}
        </span>
        <button
          onClick={onRefresh}
          className="swa-icon-btn"
          disabled={loading}
          title="Refresh"
          style={{ color: '#6B7280' }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 18,
              animation: loading ? 'ideas-refresh-spin 1s linear infinite' : undefined,
            }}
          >
            refresh
          </span>
        </button>
      </div>

      <style>{`@keyframes ideas-refresh-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
