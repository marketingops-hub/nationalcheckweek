"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * IdeasEmptyState — centred illustration + CTA shown when no ideas match.
 *
 * Copy branches on what's filtered:
 *   - filtered out by status/type → suggest clearing filters
 *   - genuinely empty stage        → prompt to generate a brief
 * ═══════════════════════════════════════════════════════════════════════════ */

import Link from "next/link";

export function IdeasEmptyState({
  filtered, onClearFilters,
}: { filtered: boolean; onClearFilters: () => void }) {
  return (
    <div style={{
      textAlign: 'center', padding: '72px 24px',
      border: '1px dashed #E5E7EB', borderRadius: 12,
      background: '#FAFAFB',
    }}>
      <div style={{
        width: 64, height: 64, margin: '0 auto 16px',
        borderRadius: 16,
        background: 'linear-gradient(135deg, #EDE9FE 0%, #F3E8FF 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 32, color: '#7C3AED' }}
        >
          emoji_objects
        </span>
      </div>

      <h3 style={{
        fontSize: 16, color: '#1E1040', margin: '0 0 8px', fontWeight: 700,
      }}>
        {filtered ? 'No ideas match these filters' : 'No ideas yet'}
      </h3>

      <p style={{
        fontSize: 13, color: '#6B7280', maxWidth: 420,
        margin: '0 auto 20px', lineHeight: 1.5,
      }}>
        {filtered
          ? 'Try switching the status tab or type filter, or kick off a new brief to generate fresh ideas.'
          : 'Start a brief and the AI will pull ideas from your Vault. Approve the ones worth pursuing, then generate full content.'}
      </p>

      <div style={{
        display: 'inline-flex', gap: 8, justifyContent: 'center',
      }}>
        {filtered && (
          <button onClick={onClearFilters} className="swa-btn">
            Clear filters
          </button>
        )}
        <Link href="/admin/content-creator/new" className="swa-btn swa-btn--primary">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          New brief
        </Link>
      </div>
    </div>
  );
}
