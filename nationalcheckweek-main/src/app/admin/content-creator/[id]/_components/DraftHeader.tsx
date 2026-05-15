"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * DraftHeader — breadcrumb + title + top-right action cluster.
 *
 * Purely presentational — receives every callback it can invoke so the
 * parent hook (useDraftDetail) owns the mutations. Keeping this dumb lets
 * us swap the header for a mobile variant later without unravelling state.
 *
 * The title falls back to the first 60 chars of the body when `title` is
 * null (which is the normal case for social posts and for freshly-minted
 * ideas). Final fallback is '(untitled)'.
 * ═══════════════════════════════════════════════════════════════════════════ */

import Link from "next/link";
import type { ContentDraft } from "@/lib/content-creator/types";

export interface DraftHeaderProps {
  draft:        ContentDraft;
  onUnapprove:  () => void;
  onArchive:    () => void;
  onDelete:     () => void;
}

export function DraftHeader({ draft, onUnapprove, onArchive, onDelete }: DraftHeaderProps) {
  const safeBody = typeof draft.body === 'string' ? draft.body : '';
  const displayTitle =
    draft.title
    ?? ((safeBody.slice(0, 60) + (safeBody.length > 60 ? '…' : '')) || '(untitled)');

  const isRunning = draft.status === 'generating' || draft.status === 'verifying';

  return (
    <div className="swa-page-header">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Link
            href="/admin/content-creator"
            style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none' }}
          >
            ← Content Creator
          </Link>
          <span style={{ color: '#D1D5DB' }}>·</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
            {draft.content_type}{draft.platform ? ` / ${draft.platform}` : ''}
          </span>
        </div>
        <h1 className="swa-page-title">{displayTitle}</h1>
        <p className="swa-page-subtitle">
          Status: <strong>{draft.status}</strong>
          {draft.brief?.topic ? <> · Topic: {draft.brief.topic}</> : null}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {draft.status === 'approved_idea' && (
          <button
            onClick={onUnapprove}
            className="swa-btn"
            title="Send back to idea for more edits"
          >
            Unapprove
          </button>
        )}
        <button
          onClick={onArchive}
          className="swa-btn"
          title="Soft-delete — reversible"
          style={{ color: '#6B7280' }}
        >
          Archive
        </button>
        <button
          onClick={onDelete}
          className="swa-btn"
          title="Delete permanently — cannot be undone"
          style={{ color: '#EF4444', borderColor: '#FECACA' }}
          disabled={isRunning}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
