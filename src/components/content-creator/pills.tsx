/* ═══════════════════════════════════════════════════════════════════════════
 * Shared pills for the content-creator UI.
 *
 * Used by `StageList.tsx` (list rows) and `[id]/page.tsx` (detail header) so
 * the same draft is always labelled consistently — any future status needs
 * exactly one code edit here rather than N forks.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { ContentStatus, ContentType, SocialPlatform } from "@/lib/content-creator/types";

/** Visual style for each pipeline status. Edits here must stay exhaustive
 *  (TS will catch missing keys via the Record). */
const STATUS_STYLES: Record<ContentStatus, { bg: string; color: string; label: string }> = {
  idea:          { bg: '#FEF3C7', color: '#B45309', label: 'Idea' },
  approved_idea: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Approved' },
  generating:    { bg: '#E0E7FF', color: '#4338CA', label: 'Generating…' },
  draft:         { bg: '#F3F4F6', color: '#374151', label: 'Draft' },
  verifying:     { bg: '#E0E7FF', color: '#4338CA', label: 'Verifying…' },
  verified:      { bg: '#D1FAE5', color: '#047857', label: 'Verified ✓' },
  rejected:      { bg: '#FEE2E2', color: '#B91C1C', label: 'Rejected' },
  archived:      { bg: '#F3F4F6', color: '#6B7280', label: 'Archived' },
};

export function StatusPill({ status }: { status: ContentStatus }) {
  const m = STATUS_STYLES[status];
  return (
    <span style={{
      background: m.bg, color: m.color, fontSize: 11, fontWeight: 700,
      padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase',
      letterSpacing: 0.5, flexShrink: 0,
    }}>{m.label}</span>
  );
}

/**
 * Type pill — dark chip showing blog/newsletter or `Social · <platform>`.
 * Platform is nullable because social posts may arrive before the user has
 * picked one (old rows); we render `?` rather than crash.
 */
export function TypePill({
  type, platform,
}: { type: ContentType; platform: SocialPlatform | string | null }) {
  const label =
    type === 'social'
      ? `Social · ${platform ?? '?'}`
      : type.charAt(0).toUpperCase() + type.slice(1);
  return (
    <span style={{
      background: '#1E1040', color: '#fff', fontSize: 11, fontWeight: 600,
      padding: '3px 8px', borderRadius: 4, flexShrink: 0,
    }}>{label}</span>
  );
}
