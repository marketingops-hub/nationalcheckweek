/* ═══════════════════════════════════════════════════════════════════════════
 * StageEmptyState — shown when a stage page has zero rows.
 *
 * Each stage gets its own illustration + copy + CTA so the admin always
 * has a next action, rather than a blank wall.
 * ═══════════════════════════════════════════════════════════════════════════ */

import Link from "next/link";
import type { StageKey } from "./stage-config";

interface EmptyConfig {
  icon:  string;   // material-symbols glyph name
  title: string;
  hint:  string;
  cta?: { href: string; label: string };
}

const EMPTY_CONFIG: Record<StageKey, EmptyConfig> = {
  ideas: {
    icon: 'lightbulb',
    title: 'No ideas yet',
    hint: 'Start a New Brief or pick an approved topic to generate 5 ideas grounded in the Vault.',
    cta: { href: '/admin/content-creator/new', label: 'Start a brief' },
  },
  drafts: {
    icon: 'edit_note',
    title: 'No drafts in progress',
    hint: 'Approve an idea to produce a full draft.',
    cta: { href: '/admin/content-creator/ideas', label: 'Browse ideas' },
  },
  verified: {
    icon: 'verified',
    title: 'Nothing verified yet',
    hint: 'Run Verify on a draft to check every claim against the Vault.',
  },
  archived: {
    icon: 'inventory_2',
    title: 'Archive is empty',
    hint: 'Archived drafts appear here.',
  },
};

export function StageEmptyState({ stageKey }: { stageKey: StageKey }) {
  const m = EMPTY_CONFIG[stageKey];
  return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF' }}>
      <span className="material-symbols-outlined"
            style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>
        {m.icon}
      </span>
      <h3 style={{ color: '#1E1040', marginBottom: 8 }}>{m.title}</h3>
      <p style={{ marginBottom: 20 }}>{m.hint}</p>
      {m.cta && (
        <Link href={m.cta.href} className="swa-btn swa-btn--primary">
          {m.cta.label}
        </Link>
      )}
    </div>
  );
}
