"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * LibraryEmptyState — rendered when the current filter yields zero results.
 *
 * Copy is filter-aware: if the user is only in an empty state because of a
 * search or type filter, the CTA clears them rather than jumping to /new.
 * ═══════════════════════════════════════════════════════════════════════════ */

import Link from "next/link";
import type { LibraryTab } from "./LibraryToolbar";

export interface LibraryEmptyStateProps {
  tab:         LibraryTab;
  query:       string;
  hasTypeFilter: boolean;
  onClearFilters: () => void;
}

export function LibraryEmptyState({
  tab, query, hasTypeFilter, onClearFilters,
}: LibraryEmptyStateProps) {
  // Anything other than the bare "all" tab with no search/type filter means
  // the user's narrowed the view down to nothing — offer a reset, not a CTA.
  const isFiltered = !!query || hasTypeFilter || tab !== 'all';

  return (
    <div
      style={{
        background: '#fff', border: '1px dashed #D1D5DB', borderRadius: 14,
        padding: '48px 24px', textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: 56, color: '#D1D5DB',
          background: '#F9FAFB', borderRadius: '50%',
          padding: 14,
        }}
      >
        {isFiltered ? 'filter_alt_off' : 'menu_book'}
      </span>

      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1E1040', margin: '0 0 4px' }}>
          {isFiltered ? 'No content matches these filters' : 'No content yet'}
        </h3>
        <p style={{ fontSize: 13, color: '#6B7280', margin: 0, maxWidth: 420 }}>
          {isFiltered
            ? 'Try broadening the search, removing the type filter, or switching to the "All created" tab.'
            : 'Once you approve an idea and generate content, it will appear here.'}
        </p>
      </div>

      {isFiltered ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="swa-btn swa-btn--primary"
          style={{ fontSize: 12, padding: '8px 14px' }}
        >
          Clear filters
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/admin/content-creator/new" className="swa-btn swa-btn--primary"
                style={{ fontSize: 12, padding: '8px 14px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
            New brief
          </Link>
          <Link href="/admin/content-creator/ideas" className="swa-btn"
                style={{ fontSize: 12, padding: '8px 14px' }}>
            Go to Ideas
          </Link>
        </div>
      )}
    </div>
  );
}
