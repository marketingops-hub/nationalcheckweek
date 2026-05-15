"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * ContentLibraryView — shared body of /library and /drafts.
 *
 * Renders the toolbar, bulk bar (when rows are selected), the card grid,
 * and the empty / loading / error states. Keeping this separate from the
 * page shells lets /drafts render the same UI with a preset tab while the
 * two pages can diverge on header copy and CTAs.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { useContentLibrary } from "../_hooks/useContentLibrary";
import { LibraryToolbar } from "./LibraryToolbar";
import { LibraryEmptyState } from "./LibraryEmptyState";
import { ContentCard } from "./ContentCard";

/** Convenience alias — whatever the hook returns. Avoids a separate types file. */
type LibraryState = ReturnType<typeof useContentLibrary>;

export function ContentLibraryView({ state }: { state: LibraryState }) {
  const {
    tab, setTab, typeFilter, setTypeFilter, query, setQuery,
    drafts, counts, loading, error, info,
    selected, allSelected, bulkBusy,
    toggleSelect, toggleSelectAll, clearSelection,
    onArchive, onDelete, onCopyBody,
    onBulkArchive, onBulkDelete,
    refresh, clearFilters,
  } = state;

  return (
    <div>
      <LibraryToolbar
        tab={tab}
        onTab={setTab}
        typeFilter={typeFilter}
        onTypeFilter={setTypeFilter}
        query={query}
        onQuery={setQuery}
        counts={counts}
        onRefresh={refresh}
        loading={loading}
      />

      {error && (
        <div className="swa-alert swa-alert--error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}
      {info && !error && (
        <div
          role="status"
          style={{
            marginBottom: 16, padding: '8px 12px',
            background: '#ECFDF5', border: '1px solid #A7F3D0',
            borderRadius: 8, color: '#065F46', fontSize: 13,
          }}
        >
          {info}
        </div>
      )}

      {/* Bulk bar — sticky at the top of the grid while selections are active. */}
      {selected.size > 0 && (
        <div
          style={{
            position: 'sticky', top: 12, zIndex: 2,
            background: '#1E1040', color: '#fff',
            borderRadius: 10, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            marginBottom: 12,
            boxShadow: '0 8px 24px rgba(16,24,40,0.18)',
          }}
        >
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            aria-label="Select all"
          />
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            {selected.size} selected
          </span>
          {bulkBusy && (
            <span style={{ fontSize: 12, color: '#C4B5FD' }}>
              {bulkBusy.label}… {bulkBusy.done}/{bulkBusy.total}
            </span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={onBulkArchive}
              disabled={!!bulkBusy}
              className="swa-btn"
              style={{ fontSize: 12, padding: '6px 10px', background: '#fff' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>archive</span>
              Archive
            </button>
            <button
              type="button"
              onClick={onBulkDelete}
              disabled={!!bulkBusy}
              className="swa-btn"
              style={{
                fontSize: 12, padding: '6px 10px',
                background: '#DC2626', color: '#fff', border: '1px solid #DC2626',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
              Delete
            </button>
            <button
              type="button"
              onClick={clearSelection}
              disabled={!!bulkBusy}
              className="swa-btn"
              style={{
                fontSize: 12, padding: '6px 10px',
                background: 'transparent', color: '#fff', border: '1px solid #4C1D95',
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {loading && drafts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
          <span
            className="material-symbols-outlined swa-spin"
            style={{ fontSize: 36, display: 'block', marginBottom: 10 }}
          >
            progress_activity
          </span>
          Loading…
        </div>
      ) : drafts.length === 0 ? (
        <LibraryEmptyState
          tab={tab}
          query={query}
          hasTypeFilter={typeFilter !== 'all'}
          onClearFilters={clearFilters}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 14,
          }}
        >
          {drafts.map((d) => (
            <ContentCard
              key={d.id}
              draft={d}
              selected={selected.has(d.id)}
              selectable={d.status !== 'generating' && d.status !== 'verifying'}
              disabled={!!bulkBusy}
              onToggleSelect={() => toggleSelect(d.id)}
              onCopyBody={()    => onCopyBody(d.id)}
              onArchive={()     => onArchive(d.id)}
              onDelete={()      => onDelete(d.id)}
            />
          ))}
        </div>
      )}

    </div>
  );
}
