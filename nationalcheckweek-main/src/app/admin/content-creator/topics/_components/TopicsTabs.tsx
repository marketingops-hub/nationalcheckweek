"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * TopicsTabs — horizontal tab strip above the topic grid.
 *
 * Each tab shows a count in parens when non-zero. Kept purely
 * presentational; the parent owns the active tab state.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { TopicStatus } from "@/lib/content-creator/topics";

export type TabKey = TopicStatus | 'all';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'draft',    label: 'To review' },
  { key: 'approved', label: 'Approved' },
  { key: 'used',     label: 'Used' },
  { key: 'archived', label: 'Archived' },
];

export function TopicsTabs({
  active, counts, totalCount, onChange,
}: {
  active:     TabKey;
  counts:     Record<TopicStatus, number>;
  totalCount: number;
  onChange:   (k: TabKey) => void;
}) {
  return (
    <div style={{
      display: 'flex', gap: 4,
      borderBottom: '1px solid #E5E7EB', marginBottom: 20,
    }}>
      {TABS.map((t) => {
        const count    = t.key === 'all' ? totalCount : counts[t.key as TopicStatus];
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderBottom: isActive ? '2px solid #1E1040' : '2px solid transparent',
              background: 'transparent',
              color: isActive ? '#1E1040' : '#6B7280',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            {t.label}
            {count > 0 && (
              <span style={{ opacity: 0.6, marginLeft: 4 }}>({count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
