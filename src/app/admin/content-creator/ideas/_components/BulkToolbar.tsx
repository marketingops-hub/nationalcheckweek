"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * BulkToolbar — sticky indigo strip that appears when ≥ 1 card is selected.
 *
 * Why sticky: selecting 5 ideas then scrolling down to find the 6th would
 * hide the actions without this. The toolbar stays visible at the top of
 * the viewport until the selection is cleared.
 *
 * Progress state shows while the hook's `runBulk` is walking ids one at a
 * time. We deliberately keep the per-id failure silent here (logged via
 * console in the hook) — the progress counter tells the admin when
 * something stalled, and they can re-run on the still-selected rows.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { BulkProgress } from "../_hooks/useIdeasList";

export interface BulkToolbarProps {
  selectedCount:      number;
  canApproveSelected: boolean;
  allVisibleSelected: boolean;
  progress:           BulkProgress | null;

  onToggleAll:  () => void;
  onApprove:    () => void;
  onGenerate:   () => void;
  onArchive:    () => void;
  onClear:      () => void;
}

export function BulkToolbar(props: BulkToolbarProps) {
  const {
    selectedCount, canApproveSelected, allVisibleSelected, progress,
    onToggleAll, onApprove, onGenerate, onArchive, onClear,
  } = props;

  if (selectedCount === 0) return null;

  const busy = !!progress;

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 20,
      background: 'linear-gradient(180deg, #5925F4 0%, #4C1FD8 100%)',
      color: '#fff',
      borderRadius: 12,
      padding: '10px 14px',
      marginBottom: 16,
      boxShadow: '0 8px 24px rgba(89, 37, 244, 0.25)',
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    }}>
      <label style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontSize: 13, fontWeight: 600, cursor: busy ? 'wait' : 'pointer',
      }}>
        <input
          type="checkbox"
          checked={allVisibleSelected}
          onChange={onToggleAll}
          disabled={busy}
          style={{ cursor: 'inherit' }}
        />
        <span>
          {selectedCount} selected
        </span>
      </label>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
        {busy ? (
          <span style={{
            fontSize: 12, padding: '6px 12px',
            background: 'rgba(255,255,255,0.15)', borderRadius: 6, fontWeight: 600,
          }}>
            {progress!.label} {progress!.done}/{progress!.total}…
          </span>
        ) : (
          <>
            <button
              onClick={onApprove}
              disabled={!canApproveSelected}
              style={{
                fontSize: 12, fontWeight: 700, padding: '7px 12px',
                background: 'rgba(255,255,255,0.15)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)', borderRadius: 6,
                cursor: canApproveSelected ? 'pointer' : 'not-allowed',
                opacity: canApproveSelected ? 1 : 0.5,
              }}
            >
              Approve
            </button>
            <button
              onClick={onGenerate}
              style={{
                fontSize: 12, fontWeight: 700, padding: '7px 12px',
                background: '#fff', color: '#5925F4',
                border: 'none', borderRadius: 6, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                auto_awesome
              </span>
              Approve &amp; Generate
            </button>
            <button
              onClick={onArchive}
              style={{
                fontSize: 12, fontWeight: 700, padding: '7px 12px',
                background: 'transparent', color: '#fff',
                border: '1px solid rgba(255,255,255,0.35)', borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Archive
            </button>
            <button
              onClick={onClear}
              aria-label="Clear selection"
              title="Clear selection"
              style={{
                background: 'transparent', color: '#fff',
                border: 'none', cursor: 'pointer',
                padding: 4, display: 'inline-flex', alignItems: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                close
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
