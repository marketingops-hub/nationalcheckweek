/* ═══════════════════════════════════════════════════════════════════════════
 * DraftRow — single row in a StageList.
 *
 * Tolerates partial rows (missing body, missing brief.topic) because we've
 * seen them in practice when an edge-fn failure leaves a half-written
 * content_drafts row. A bad row renders as "(untitled)" rather than
 * crashing the whole list.
 * ═══════════════════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { StatusPill, TypePill } from "./pills";
import type { ContentDraft } from "@/lib/content-creator/types";

/** Coerce any unknown value to a safe string — null/undefined/number/etc → ''. */
function safeText(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

export interface DraftRowProps {
  draft:          ContentDraft;
  onApprove:      (id: string) => void;
  /** Send an approved_idea back to idea state. Only visible on that status. */
  onUnapprove:    (id: string) => void;
  onArchive:      (id: string) => void;
  /** Permanent removal. Only visible on terminal / early states. */
  onDelete:       (id: string) => void;
  selectable:     boolean;
  selected:       boolean;
  onToggleSelect: () => void;
  /** True while a bulk action is in flight — freezes per-row affordances. */
  disabled:       boolean;
}

export function DraftRow({
  draft, onApprove, onUnapprove, onArchive, onDelete,
  selectable, selected, onToggleSelect, disabled,
}: DraftRowProps) {
  const body  = safeText(draft.body);
  const title = draft.title ?? (body.slice(0, 80) + (body.length > 80 ? '…' : ''));
  const topic = safeText(draft.brief?.topic);
  const isGenerating = draft.status === 'generating' || draft.status === 'verifying';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: selected ? '#F5F3FF' : '#fff',
      border: '1px solid ' + (selected ? '#C4B5FD' : '#E5E7EB'),
      borderRadius: 12, padding: '14px 18px',
      opacity: disabled ? 0.6 : 1,
      // Explicit full width + box-sizing defend against parent flex/grid
      // ancestors that occasionally stretched the row past its column.
      width: '100%', boxSizing: 'border-box',
      // If content still overflows despite nowrap/ellipsis below, hide it
      // rather than let it blow the row open and collapse the title column.
      overflow: 'hidden',
    }}>
      {selectable ? (
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          disabled={disabled}
          style={{ cursor: disabled ? 'wait' : 'pointer', flexShrink: 0 }}
        />
      ) : (
        // Placeholder to keep column alignment consistent on non-selectable rows.
        <span style={{ width: 13, flexShrink: 0 }} />
      )}

      <StatusPill status={draft.status} />
      <TypePill type={draft.content_type} platform={draft.platform} />

      {/* flex: '1 1 0' with minWidth: 0 is the canonical recipe for a
          shrinkable flex child. Both title and topic get nowrap+ellipsis
          so a long topic string can't blow the layout open. */}
      <div style={{ flex: '1 1 0', minWidth: 0, overflow: 'hidden' }}>
        <div style={{
          fontWeight: 600, color: '#1E1040', marginBottom: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {title || '(untitled)'}
        </div>
        <div style={{
          fontSize: 12, color: '#9CA3AF',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {topic && <>topic: {topic}</>}
          <span> · updated {new Date(draft.updated_at).toLocaleString()}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
        {/* Stage-specific primary action ─────────────────────────────── */}
        {draft.status === 'idea' && (
          <button
            onClick={() => onApprove(draft.id)}
            className="swa-btn swa-btn--primary"
            style={{ fontSize: 13, padding: '6px 12px', flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            Approve
          </button>
        )}
        {draft.status === 'approved_idea' && (
          <button
            onClick={() => onUnapprove(draft.id)}
            className="swa-btn"
            title="Send back to idea for more edits"
            style={{ fontSize: 13, padding: '6px 12px', flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            Unapprove
          </button>
        )}

        {/* Edit = the detail page. Disabled while AI is mid-flight. */}
        <Link
          href={`/admin/content-creator/${draft.id}`}
          className="swa-icon-btn"
          title={isGenerating ? 'In progress…' : 'Edit'}
          style={isGenerating ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
          aria-disabled={isGenerating}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
        </Link>

        {/* Archive (soft) — hidden on already-archived rows. */}
        {draft.status !== 'archived' && (
          <button
            onClick={() => onArchive(draft.id)}
            className="swa-icon-btn"
            title="Archive (reversible)"
            style={{ color: '#9CA3AF' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>archive</span>
          </button>
        )}

        {/* Hard delete — offered on non-running rows. Confirmation is in
            the parent onDelete handler so we don't double-prompt. */}
        {!isGenerating && (
          <button
            onClick={() => onDelete(draft.id)}
            className="swa-icon-btn"
            title="Delete permanently"
            style={{ color: '#EF4444' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
          </button>
        )}
      </div>
    </div>
  );
}
