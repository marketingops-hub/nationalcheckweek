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
  onArchive:      (id: string) => void;
  selectable:     boolean;
  selected:       boolean;
  onToggleSelect: () => void;
  /** True while a bulk action is in flight — freezes per-row affordances. */
  disabled:       boolean;
}

export function DraftRow({
  draft, onApprove, onArchive,
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

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 600, color: '#1E1040', marginBottom: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {title || '(untitled)'}
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>
          {topic && <>topic: {topic}</>}
          <span> · updated {new Date(draft.updated_at).toLocaleString()}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {draft.status === 'idea' && (
          <button
            onClick={() => onApprove(draft.id)}
            className="swa-btn swa-btn--primary"
            style={{ fontSize: 13, padding: '6px 12px' }}
          >
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
          <button
            onClick={() => onArchive(draft.id)}
            className="swa-icon-btn"
            title="Archive"
            style={{ color: '#EF4444' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>archive</span>
          </button>
        )}
      </div>
    </div>
  );
}
