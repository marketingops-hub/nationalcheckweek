"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * TopicCard — single tile in the topics grid.
 *
 * Shows title, angle, rationale, keyword chips, category, source count,
 * and action buttons whose visibility is status-driven:
 *   draft    → Approve | Use → | Archive | Delete
 *   approved → Use →          | Archive | Delete
 *   used     → View draft     |         | Delete
 *   archived →                           | Delete
 *
 * `onDelete` always confirms inside the parent so this component stays
 * free of imperative UI side-effects.
 * ═══════════════════════════════════════════════════════════════════════════ */

import Link from "next/link";
import type { ContentTopic, TopicStatus } from "@/lib/content-creator/topics";

const STATUS_CHIP: Record<TopicStatus, { bg: string; color: string; label: string }> = {
  draft:    { bg: '#FEF3C7', color: '#92400E', label: 'To review' },
  approved: { bg: '#D1FAE5', color: '#047857', label: 'Approved'  },
  used:     { bg: '#E0E7FF', color: '#4338CA', label: 'Used'      },
  archived: { bg: '#F3F4F6', color: '#6B7280', label: 'Archived'  },
};

export function TopicCard({
  topic, onApprove, onArchive, onDelete,
}: {
  topic:     ContentTopic;
  onApprove: () => void;
  onArchive: () => void;
  onDelete:  () => void;
}) {
  const usable = topic.status === 'approved' || topic.status === 'draft';
  const chip   = STATUS_CHIP[topic.status];

  return (
    <div style={{
      background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
      padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <h3 style={{
          flex: 1, fontSize: 15, fontWeight: 700, color: '#1E1040',
          margin: 0, lineHeight: 1.3,
        }}>
          {topic.title}
        </h3>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
          background: chip.bg, color: chip.color,
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          {chip.label}
        </span>
      </div>

      <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5 }}>
        {topic.angle}
      </p>

      {topic.rationale && (
        <p style={{
          fontSize: 12, color: '#6B7280', margin: 0,
          fontStyle: 'italic', lineHeight: 1.4,
        }}>
          {topic.rationale}
        </p>
      )}

      {(topic.suggested_keywords ?? []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {(topic.suggested_keywords ?? []).slice(0, 6).map((k) => (
            <span key={k} style={{
              fontSize: 11, padding: '2px 8px',
              background: '#F3F4F6', borderRadius: 4, color: '#374151',
            }}>
              {k}
            </span>
          ))}
        </div>
      )}

      <div style={{
        fontSize: 11, color: '#9CA3AF',
        display: 'flex', gap: 10, flexWrap: 'wrap',
      }}>
        {topic.vault_category && (
          <span style={{
            background: '#EEF2FF', color: '#4338CA',
            padding: '2px 8px', borderRadius: 4, fontWeight: 600,
          }}>
            {topic.vault_category}
          </span>
        )}
        <span>
          {(topic.source_document_ids ?? []).length} source
          {(topic.source_document_ids ?? []).length === 1 ? '' : 's'}
        </span>
        {topic.suggested_audience && <span>· {topic.suggested_audience}</span>}
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
        {topic.status === 'draft' && (
          <button
            onClick={onApprove}
            className="swa-btn swa-btn--primary"
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            Approve
          </button>
        )}
        {usable && (
          <Link
            href={`/admin/content-creator/new?topic_id=${topic.id}`}
            className="swa-btn"
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
            Use →
          </Link>
        )}
        {topic.status === 'used' && topic.used_in_draft_id && (
          <Link
            href={`/admin/content-creator/${topic.used_in_draft_id}`}
            className="swa-btn"
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            View draft
          </Link>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {topic.status !== 'archived' && topic.status !== 'used' && (
            <button onClick={onArchive} className="swa-icon-btn" title="Archive">
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#6B7280' }}>archive</span>
            </button>
          )}
          <button onClick={onDelete} className="swa-icon-btn" title="Delete permanently">
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#EF4444' }}>delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
