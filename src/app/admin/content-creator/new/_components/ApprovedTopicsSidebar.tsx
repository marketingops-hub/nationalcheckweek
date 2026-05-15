"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * ApprovedTopicsSidebar — right-hand column listing approved topics the
 * admin can click to prefill the brief.
 *
 * Hidden entirely when the list is empty (the parent decides based on
 * `topics.length` whether to render this component at all, which also
 * collapses the page's two-column grid back to one column).
 *
 * `activeId` is the id of the currently-linked topic, used to highlight
 * its card with an indigo border.
 * ═══════════════════════════════════════════════════════════════════════════ */

import Link from "next/link";
import type { ContentTopic } from "@/lib/content-creator/topics";

export function ApprovedTopicsSidebar({
  topics, activeId, onPick,
}: {
  topics:   ContentTopic[];
  activeId: string | null;
  onPick:   (t: ContentTopic) => void;
}) {
  return (
    <aside>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <h3 style={{
          fontSize: 12, fontWeight: 700, color: '#1E1040',
          textTransform: 'uppercase', letterSpacing: 0.5, margin: 0,
        }}>
          Approved topics
        </h3>
        <Link
          href="/admin/content-creator/topics"
          style={{ fontSize: 11, color: '#6B7280', textDecoration: 'none' }}
        >
          All →
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {topics.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onPick(t)}
            style={{
              textAlign: 'left',
              background: '#fff',
              border: `1px solid ${activeId === t.id ? '#4338CA' : '#E5E7EB'}`,
              borderRadius: 10,
              padding: 10,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <div style={{
              fontSize: 13, fontWeight: 600, color: '#1E1040',
              lineHeight: 1.3, marginBottom: 4,
            }}>
              {t.title}
            </div>
            {t.vault_category && (
              <span style={{
                fontSize: 10, padding: '1px 6px',
                background: '#EEF2FF', color: '#4338CA',
                borderRadius: 3, fontWeight: 600,
              }}>
                {t.vault_category}
              </span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}
