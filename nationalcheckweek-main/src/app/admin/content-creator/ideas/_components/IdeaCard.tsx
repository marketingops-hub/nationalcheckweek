"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * IdeaCard — single tile in the ideas grid.
 *
 * Designed to make ideas genuinely scannable (they're creative content, not
 * spreadsheet rows). Visual hierarchy:
 *
 *   1. Left accent stripe — status colour, subtle, only visible on hover
 *      and when selected.
 *   2. Top row — type+platform chip, status chip, overflow buttons.
 *   3. Title — large, bold. Falls back to a 60-char body snippet when the
 *      row has no title (social posts, ideas pre-generation).
 *   4. Body — the AI-generated idea summary. 4-line clamp.
 *   5. Footer — topic + updated time, small and grey.
 *   6. Primary action — "Approve" or "Generate content" depending on status.
 *
 * Checkbox is top-right and only selectable for idea + approved_idea. A
 * row in `generating` shows a spinner chip instead of the checkbox so
 * nobody accidentally queues a second AI call on a row mid-flight.
 * ═══════════════════════════════════════════════════════════════════════════ */

import Link from "next/link";
import type { ContentDraft } from "@/lib/content-creator/types";

/* ─── Status styling ─────────────────────────────────────────────────────── */

const STATUS_THEME: Record<string, { stripe: string; chipBg: string; chipColor: string; label: string }> = {
  idea:          { stripe: '#F59E0B', chipBg: '#FEF3C7', chipColor: '#92400E', label: 'Idea' },
  approved_idea: { stripe: '#2563EB', chipBg: '#DBEAFE', chipColor: '#1D4ED8', label: 'Approved' },
  generating:    { stripe: '#7C3AED', chipBg: '#EDE9FE', chipColor: '#5B21B6', label: 'Generating…' },
};

/* ─── Type / platform chip ───────────────────────────────────────────────── */

function typeLabel(d: ContentDraft) {
  if (d.content_type === 'social') return `Social · ${d.platform ?? '?'}`;
  return d.content_type.charAt(0).toUpperCase() + d.content_type.slice(1);
}

/* ─── Relative time ─────────────────────────────────────────────────────── */

function relTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1)     return 'just now';
  if (mins < 60)    return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24)   return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days  < 7)    return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export interface IdeaCardProps {
  idea:          ContentDraft;
  selected:      boolean;
  selectable:    boolean;
  disabled:      boolean;
  onToggleSelect: () => void;
  onApprove:     () => void;
  onUnapprove:   () => void;
  onGenerate:    () => void;
  onArchive:     () => void;
  onDelete:      () => void;
  /** Unstick a row the edge fn stranded in 'generating'. Only wired
   *  when the card renders for a 'generating' row AND that row's
   *  updated_at is ≥ STUCK_THRESHOLD_MS old. */
  onRecover:     () => void;
}

/** Rows that have been in 'generating' longer than this are almost
 *  certainly stuck — the edge fn's hard runtime cap is 150s and the
 *  full chain p95 is ~90-150s. We wait 5 min to avoid racing a real
 *  in-flight request; the server /recover endpoint enforces the same
 *  floor server-side. */
const STUCK_THRESHOLD_MS = 5 * 60 * 1000;

export function IdeaCard(props: IdeaCardProps) {
  const {
    idea, selected, selectable, disabled,
    onToggleSelect, onApprove, onUnapprove, onGenerate, onArchive, onDelete, onRecover,
  } = props;

  const theme = STATUS_THEME[idea.status] ?? STATUS_THEME.idea;
  // A row is 'stuck' when it's been sitting in 'generating' for longer
  // than the AI chain's realistic max runtime. We compute this from
  // updated_at (which the status-flip at the start of generate-stage
  // bumped) so the threshold matches the server's own /recover gate.
  const stuckMs = idea.status === 'generating'
    ? Date.now() - new Date(idea.updated_at).getTime()
    : 0;
  const isStuck = stuckMs >= STUCK_THRESHOLD_MS;

  const safeBody = typeof idea.body === 'string' ? idea.body : '';
  // Title falls back to a 60-char body snippet, then to a generic label.
  // The `||` (not `??`) on the middle leg matters — safeBody may be ''.
  const displayTitle =
    idea.title
    || (safeBody.slice(0, 60) + (safeBody.length > 60 ? '…' : ''))
    || '(untitled)';

  // When the title falls back to a body snippet, hide the body section to
  // avoid rendering the same text twice.
  const showBody = !!idea.title && safeBody.length > 0;

  const isGenerating = idea.status === 'generating';

  return (
    <div
      style={{
        position: 'relative',
        background: '#fff',
        border: `1px solid ${selected ? '#5925F4' : '#E5E7EB'}`,
        borderRadius: 12,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
        boxShadow: selected
          ? '0 4px 14px rgba(89, 37, 244, 0.14)'
          : '0 1px 2px rgba(16, 24, 40, 0.04)',
        opacity: disabled ? 0.55 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 4px 14px rgba(16, 24, 40, 0.08)';
      }}
      onMouseLeave={(e) => {
        if (!selected) (e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 1px 2px rgba(16, 24, 40, 0.04)';
      }}
    >
      {/* Left accent stripe — status colour */}
      <span
        aria-hidden
        style={{
          position: 'absolute', top: 14, bottom: 14, left: 0,
          width: 3, borderRadius: 2,
          background: theme.stripe,
          opacity: selected ? 1 : 0.5,
        }}
      />

      {/* Row 1: chips + checkbox/spinner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
          background: '#1E1040', color: '#fff',
          textTransform: 'capitalize',
        }}>
          {typeLabel(idea)}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
          background: theme.chipBg, color: theme.chipColor,
          textTransform: 'uppercase', letterSpacing: 0.4,
        }}>
          {theme.label}
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          {isGenerating ? (
            <span
              className="material-symbols-outlined swa-spin"
              aria-label="Generating"
              style={{ fontSize: 18, color: '#7C3AED' }}
            >
              progress_activity
            </span>
          ) : selectable ? (
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              aria-label="Select idea"
              style={{ cursor: 'pointer', width: 16, height: 16 }}
            />
          ) : null}
        </div>
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: 15, fontWeight: 700, color: '#1E1040',
        margin: 0, lineHeight: 1.35,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {displayTitle}
      </h3>

      {/* Body summary */}
      {showBody && (
        <p style={{
          margin: 0, fontSize: 13, color: '#4B5563', lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {safeBody}
        </p>
      )}

      {/* Meta footer */}
      <div style={{
        fontSize: 11, color: '#9CA3AF',
        display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
      }}>
        {idea.brief?.topic && (
          <span style={{
            maxWidth: '100%', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            <strong style={{ color: '#6B7280', fontWeight: 600 }}>Topic:</strong>{' '}
            {idea.brief.topic}
          </span>
        )}
        <span>· {relTime(idea.updated_at)}</span>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex', gap: 6, marginTop: 4,
        alignItems: 'center', flexWrap: 'wrap',
      }}>
        {idea.status === 'idea' && (
          <>
            <button
              onClick={onApprove}
              className="swa-btn"
              style={{ fontSize: 12, padding: '6px 12px' }}
            >
              Approve
            </button>
            <button
              onClick={onGenerate}
              className="swa-btn swa-btn--primary"
              style={{ fontSize: 12, padding: '6px 12px' }}
              title="Approve and generate content in one click"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                auto_awesome
              </span>
              Generate
            </button>
          </>
        )}

        {idea.status === 'approved_idea' && (
          <>
            <button
              onClick={onGenerate}
              className="swa-btn swa-btn--primary"
              style={{ fontSize: 12, padding: '6px 12px' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                auto_awesome
              </span>
              Generate content
            </button>
            <button
              onClick={onUnapprove}
              className="swa-btn"
              style={{ fontSize: 12, padding: '6px 12px' }}
              title="Send back to Idea so you can edit it"
            >
              Unapprove
            </button>
          </>
        )}

        {/* 'Generating…' row that's been stuck past the AI chain's
            realistic max runtime. We surface a Recover CTA inline so
            the admin doesn't have to click through to the detail
            page + wait 90s for its own stuck banner to appear. */}
        {idea.status === 'generating' && isStuck && (
          <button
            onClick={onRecover}
            className="swa-btn swa-btn--primary"
            style={{ fontSize: 12, padding: '6px 12px', background: '#EF4444', borderColor: '#EF4444' }}
            title={`Stuck for ${Math.round(stuckMs / 60000)} min — roll back to ${idea.body && idea.body.length > 0 ? "'draft'" : "'approved_idea'"} so you can retry`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              restart_alt
            </span>
            Recover (stuck {Math.round(stuckMs / 60000)}m)
          </button>
        )}

        {/* Link to detail + icon actions on the right */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2, alignItems: 'center' }}>
          <Link
            href={`/admin/content-creator/${idea.id}`}
            className="swa-icon-btn"
            title={isGenerating ? 'In progress — open to watch' : 'Open / edit'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              open_in_new
            </span>
          </Link>
          <button
            onClick={onArchive}
            className="swa-icon-btn"
            title="Archive (reversible)"
            disabled={isGenerating}
            style={{ color: '#9CA3AF' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              archive
            </span>
          </button>
          <button
            onClick={onDelete}
            className="swa-icon-btn"
            title="Delete permanently"
            disabled={isGenerating}
            style={{ color: '#EF4444' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              delete
            </span>
          </button>
        </div>
      </div>

    </div>
  );
}
