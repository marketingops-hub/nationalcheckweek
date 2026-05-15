"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * SourceTopicBanner — indigo strip shown when the brief was pre-filled
 * from an approved topic. Includes a close-X that unlinks the topic.
 *
 * The banner is intentionally dismissable: unlinking simply clears the
 * `source_topic_id` — the form fields themselves stay filled so the admin
 * doesn't have to re-type the prefilled values.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { ContentTopic } from "@/lib/content-creator/topics";

export function SourceTopicBanner({
  topic, onUnlink,
}: { topic: ContentTopic; onUnlink: () => void }) {
  return (
    <div style={{
      background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 10,
      padding: '12px 16px', marginBottom: 20,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span className="material-symbols-outlined" style={{ color: '#4338CA' }}>lightbulb</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: '#4338CA',
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          Pre-filled from topic
        </div>
        <div style={{
          fontSize: 14, color: '#1E1040', fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {topic.title}
        </div>
        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
          Generating ideas will retire this topic (one-shot).
        </div>
      </div>

      <button type="button" onClick={onUnlink} className="swa-icon-btn" title="Unlink topic">
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
      </button>
    </div>
  );
}
