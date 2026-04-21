"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * ContentCard — single tile in the Content Library grid.
 *
 * Used by /admin/content-creator/library and /admin/content-creator/drafts
 * (post Apr-2026 redesign). Replaces the old row-based StageList UI for
 * everything that isn't an idea.
 *
 * Visual hierarchy, top → bottom:
 *   1. Status + type chips                    (so the reader instantly
 *                                              knows what they're looking at)
 *   2. Title (falls back to body snippet)     (the thing they're hunting for)
 *   3. 3-line body preview                    (skim before opening)
 *   4. Metadata strip                          (topic · words · updated)
 *   5. Action row                              (Open · Copy · Archive · Delete)
 *
 * Selection checkbox sits top-right and only appears for rows that the
 * parent marks `selectable`. In-flight rows (generating / verifying)
 * show a spinner chip instead so nobody can queue a second AI call.
 *
 * This component is deliberately framework-styled only (inline styles).
 * The rest of the admin uses inline styles too, and pulling in CSS
 * modules for one grid is not worth the build complexity.
 * ═══════════════════════════════════════════════════════════════════════════ */

import Link from "next/link";
import type { ContentDraft } from "@/lib/content-creator/types";

/* ─── Status / type theming ───────────────────────────────────────────────
 * Colours mirror the existing StatusPill theme so a user glancing from the
 * overview to the library sees the same purple for "generating" etc. */

const STATUS_THEME: Record<string, { bg: string; color: string; label: string; stripe: string }> = {
  idea:          { bg: '#FEF3C7', color: '#92400E', label: 'Idea',          stripe: '#F59E0B' },
  approved_idea: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Approved idea', stripe: '#2563EB' },
  generating:    { bg: '#EDE9FE', color: '#5B21B6', label: 'Generating…',   stripe: '#7C3AED' },
  draft:         { bg: '#E0E7FF', color: '#3730A3', label: 'Draft',         stripe: '#4F46E5' },
  verifying:     { bg: '#EDE9FE', color: '#5B21B6', label: 'Verifying…',    stripe: '#7C3AED' },
  rejected:      { bg: '#FEE2E2', color: '#991B1B', label: 'Rejected',      stripe: '#DC2626' },
  verified:      { bg: '#D1FAE5', color: '#065F46', label: 'Verified',      stripe: '#10B981' },
  archived:      { bg: '#F3F4F6', color: '#6B7280', label: 'Archived',      stripe: '#9CA3AF' },
};

function typeLabel(d: ContentDraft) {
  if (d.content_type === 'social') return `Social · ${d.platform ?? '?'}`;
  return d.content_type.charAt(0).toUpperCase() + d.content_type.slice(1);
}

function relTime(iso: string) {
  const ms   = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days  = Math.floor(hours / 24);
  if (days  < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** Rough word count. Markdown syntax chars are irrelevant here; this is
 *  surfaced to the reader, not to the rate limiter. */
function countWords(s: string): number {
  const trimmed = s.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export interface ContentCardProps {
  draft:          ContentDraft;
  selected:       boolean;
  selectable:     boolean;
  disabled:       boolean;
  onToggleSelect: () => void;
  onCopyBody:     () => void;
  onArchive:      () => void;
  /** Present only for already-archived rows. Rest of the grid hides it. */
  onUnarchive?:   () => void;
  onDelete:       () => void;
}

export function ContentCard(props: ContentCardProps) {
  const {
    draft, selected, selectable, disabled,
    onToggleSelect, onCopyBody, onArchive, onUnarchive, onDelete,
  } = props;

  const theme = STATUS_THEME[draft.status] ?? STATUS_THEME.draft;

  const safeBody = typeof draft.body === 'string' ? draft.body : '';
  // Title fallback chain matches IdeaCard so both grids feel consistent.
  const displayTitle =
    draft.title
    || (safeBody.slice(0, 60) + (safeBody.length > 60 ? '…' : ''))
    || '(untitled)';
  const showBody = !!draft.title && safeBody.length > 0;

  const topic = typeof draft.brief?.topic === 'string' ? draft.brief.topic : '';
  const words = countWords(safeBody);

  const isInFlight  = draft.status === 'generating' || draft.status === 'verifying';
  const isArchived  = draft.status === 'archived';

  return (
    <div
      style={{
        position: 'relative',
        background: '#fff',
        border: `1px solid ${selected ? '#5925F4' : '#E5E7EB'}`,
        borderRadius: 14,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxShadow: selected
          ? '0 0 0 3px rgba(89,37,244,0.08)'
          : '0 1px 2px rgba(16,24,40,0.03)',
        opacity: disabled ? 0.6 : 1,
        transition: 'box-shadow 120ms ease, border-color 120ms ease',
        minHeight: 220,
      }}
    >
      {/* Left accent stripe — status colour, subtle. */}
      <span
        aria-hidden
        style={{
          position: 'absolute', left: 0, top: 14, bottom: 14, width: 3,
          borderRadius: 3, background: theme.stripe,
          opacity: selected ? 1 : 0.5,
        }}
      />

      {/* Top row: chips + selection */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <Chip bg={theme.bg} color={theme.color}>{theme.label}</Chip>
        <Chip bg="#F3F4F6" color="#374151">{typeLabel(draft)}</Chip>

        {isInFlight ? (
          <span
            title="AI run in progress"
            style={{
              marginLeft: 'auto', display: 'inline-flex', alignItems: 'center',
              gap: 4, color: '#7C3AED', fontSize: 11, fontWeight: 600,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 14, animation: 'spin 1s linear infinite' }}
            >
              progress_activity
            </span>
            Working…
          </span>
        ) : selectable ? (
          <label
            style={{
              marginLeft: 'auto', display: 'inline-flex', alignItems: 'center',
              gap: 4, cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              disabled={disabled}
              style={{ cursor: 'inherit' }}
              aria-label="Select for bulk action"
            />
          </label>
        ) : null}
      </div>

      {/* Title */}
      <Link
        href={`/admin/content-creator/${draft.id}`}
        style={{
          color: '#1E1040', fontSize: 16, fontWeight: 700, lineHeight: 1.35,
          textDecoration: 'none',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
        title={displayTitle}
      >
        {displayTitle}
      </Link>

      {/* Body preview (only when title isn't already the body snippet) */}
      {showBody && (
        <p
          style={{
            margin: 0, color: '#4B5563', fontSize: 13, lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {safeBody}
        </p>
      )}

      {/* Metadata strip */}
      <div
        style={{
          marginTop: 'auto', fontSize: 11, color: '#9CA3AF',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}
      >
        {topic && (
          <span
            title={topic}
            style={{
              maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: -2 }}>
              topic
            </span>{' '}
            {topic}
          </span>
        )}
        {words > 0 && (
          <span>
            <span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: -2 }}>
              description
            </span>{' '}
            {words.toLocaleString()} words
          </span>
        )}
        <span style={{ marginLeft: 'auto' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: -2 }}>
            schedule
          </span>{' '}
          {relTime(draft.updated_at)}
        </span>
      </div>

      {/* Action row */}
      <div style={{
        display: 'flex', gap: 6, paddingTop: 8, borderTop: '1px solid #F3F4F6',
        alignItems: 'center',
      }}>
        <Link
          href={`/admin/content-creator/${draft.id}`}
          className="swa-btn swa-btn--primary"
          style={{
            fontSize: 12, padding: '6px 12px',
            pointerEvents: isInFlight ? 'none' : undefined,
            opacity:        isInFlight ? 0.5 : 1,
          }}
          aria-disabled={isInFlight}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            open_in_new
          </span>
          Open
        </Link>

        <button
          type="button"
          onClick={onCopyBody}
          disabled={disabled || safeBody.length === 0}
          className="swa-btn"
          style={{ fontSize: 12, padding: '6px 10px' }}
          title="Copy body to clipboard"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            content_copy
          </span>
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {isArchived ? (
            onUnarchive && (
              <button
                type="button"
                onClick={onUnarchive}
                disabled={disabled}
                className="swa-icon-btn"
                title="Restore from archive"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  unarchive
                </span>
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={onArchive}
              disabled={disabled || isInFlight}
              className="swa-icon-btn"
              title="Archive (reversible)"
              style={{ color: '#9CA3AF' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                archive
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            disabled={disabled || isInFlight}
            className="swa-icon-btn"
            title="Delete permanently"
            style={{ color: '#EF4444' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              delete
            </span>
          </button>
        </div>
      </div>

      {/* Local keyframe for the spinner chip. Scoped via a dynamic <style>
          block so we don't bleed global animations into the rest of the
          admin. Duplicated on every card is fine — the browser dedupes. */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Local primitive ────────────────────────────────────────────────────── */

function Chip({
  bg, color, children,
}: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
      background: bg, color, textTransform: 'uppercase', letterSpacing: 0.5,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}
