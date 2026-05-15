"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/content-creator/drafts — redesigned Apr 2026.
 *
 * Previously this page used the row-based StageList, which the user flagged
 * as "a mess". Replaced with the new card-grid Content Library view, preset
 * to the "drafts" tab. Functionally identical (same set of statuses, same
 * bulk actions) but the information density is closer to an idea wall than
 * a spreadsheet, which is what the actual use case calls for.
 *
 * Users who want the fully-unified view land on /admin/content-creator/library.
 * This page stays as a focused "things that still need my attention" shortcut.
 * ═══════════════════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { useContentLibrary } from "../library/_hooks/useContentLibrary";
import { ContentLibraryView } from "../library/_components/ContentLibraryView";

export default function DraftsPage() {
  const state = useContentLibrary({ initialTab: 'drafts' });

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Link
              href="/admin/content-creator"
              style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none' }}
            >
              ← Content Creator
            </Link>
          </div>
          <h1 className="swa-page-title">Drafts</h1>
          <p className="swa-page-subtitle">
            Articles waiting on you — edit the body, then Verify against the Vault.
            Looking for something that&apos;s already verified?{' '}
            <Link href="/admin/content-creator/library">See all content →</Link>
          </p>
        </div>
        <Link href="/admin/content-creator/new" className="swa-btn swa-btn--primary">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          New Brief
        </Link>
      </div>

      <ContentLibraryView state={state} />
    </div>
  );
}
