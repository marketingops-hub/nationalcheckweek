/* ═══════════════════════════════════════════════════════════════════════════
 * BulkBar — selection + bulk-action strip at the top of a `StageList`.
 *
 * Lives in its own file because (a) it's the most UI-dense piece and
 * (b) it's stage-aware: only the `ideas` stage exposes Approve /
 * Approve & Generate. Everywhere else gets Archive only. Keeping the
 * stage-specific branching here keeps `StageList.tsx` focused on data flow.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { StageKey } from "./stage-config";

export interface BulkBarProps {
  /** "Select all visible selectable items" checkbox state. */
  allSelected:   boolean;
  onToggleAll:   () => void;

  /** Non-null while a bulk action is in flight — shows a progress label. */
  bulkBusy:      null | { label: string; done: number; total: number };

  selectedCount: number;
  stageKey:      StageKey;

  /** True when at least one selected row is an `idea` (eligible for approve). */
  canApprove:    boolean;
  onApprove:     () => void;
  onGenerate:    () => void;
  onArchive:     () => void;
  onClear:       () => void;
}

export function BulkBar(props: BulkBarProps) {
  const {
    allSelected, onToggleAll, bulkBusy, selectedCount, stageKey,
    canApprove, onApprove, onGenerate, onArchive, onClear,
  } = props;

  const hasSelection = selectedCount > 0;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
      background: hasSelection ? '#EEF2FF' : '#F9FAFB',
      border: '1px solid ' + (hasSelection ? '#C7D2FE' : '#E5E7EB'),
      borderRadius: 10, marginBottom: 10, fontSize: 13,
    }}>
      <input
        type="checkbox"
        checked={allSelected}
        onChange={onToggleAll}
        disabled={!!bulkBusy}
        title={allSelected ? 'Clear selection' : 'Select all'}
        style={{ cursor: bulkBusy ? 'wait' : 'pointer' }}
      />

      {!hasSelection ? (
        <span style={{ color: '#6B7280' }}>
          Select {stageKey === 'ideas' ? 'ideas to approve or generate' : 'items'} in bulk.
        </span>
      ) : (
        <>
          <span style={{ fontWeight: 600, color: '#1E1040' }}>
            {selectedCount} selected
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {bulkBusy ? (
              <span style={{ color: '#4338CA', fontWeight: 600 }}>
                {bulkBusy.label} {bulkBusy.done}/{bulkBusy.total}…
              </span>
            ) : (
              <>
                {stageKey === 'ideas' && (
                  <>
                    <button
                      onClick={onApprove}
                      className="swa-btn"
                      disabled={!canApprove}
                      style={{ fontSize: 12, padding: '6px 12px' }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={onGenerate}
                      className="swa-btn swa-btn--primary"
                      style={{ fontSize: 12, padding: '6px 12px' }}
                    >
                      Approve &amp; Generate
                    </button>
                  </>
                )}
                <button
                  onClick={onArchive}
                  className="swa-btn"
                  style={{ fontSize: 12, padding: '6px 12px', color: '#B91C1C' }}
                >
                  Archive
                </button>
                <button onClick={onClear} className="swa-icon-btn" title="Clear selection">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
