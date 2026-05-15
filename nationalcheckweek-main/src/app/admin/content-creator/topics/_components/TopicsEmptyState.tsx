"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * TopicsEmptyState — message + CTA shown when a tab has no rows.
 *
 * The copy varies by tab because the right next step is tab-specific:
 * from 'draft' you generate; from 'approved' you go back and approve some;
 * etc. The Generate CTA only appears on 'draft' and 'all'.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { TopicStatus } from "@/lib/content-creator/topics";

export function TopicsEmptyState({
  tab, onGenerate,
}: { tab: TopicStatus | 'all'; onGenerate: () => void }) {
  const msg =
    tab === 'draft'    ? "No topics awaiting review. Generate some from the Vault to get started." :
    tab === 'approved' ? "No approved topics yet. Approve some from the 'To review' tab." :
    tab === 'used'     ? "No used topics yet. Topics move here after they spawn a draft." :
    tab === 'archived' ? "Nothing archived." :
                         "No topics yet.";

  return (
    <div style={{
      textAlign: 'center', padding: '60px 24px', color: '#9CA3AF',
      border: '1px dashed #E5E7EB', borderRadius: 12,
    }}>
      <span className="material-symbols-outlined" style={{
        fontSize: 48, display: 'block', marginBottom: 16, color: '#D1D5DB',
      }}>
        lightbulb
      </span>
      <p style={{ marginBottom: 20 }}>{msg}</p>
      {(tab === 'draft' || tab === 'all') && (
        <button onClick={onGenerate} className="swa-btn swa-btn--primary">
          Generate topics from vault
        </button>
      )}
    </div>
  );
}
