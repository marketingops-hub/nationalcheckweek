"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/content-creator/library — "Content Created"
 *
 * The single place to find every piece of content the pipeline has ever
 * produced. Replaces the old per-status pages as the primary entry point;
 * /drafts, /verified, /archived still work (and now also use this grid,
 * just with the tab preset).
 *
 * The previous row-based UI made it hard to find a specific article after
 * generation — rows landed on /drafts or /verified depending on status
 * and the user didn't always know which. This page unifies them under one
 * "All created" tab with search, so "I just created this, where is it?"
 * always has an obvious answer.
 *
 * Thin orchestrator. All state lives in `useContentLibrary`; card / toolbar
 * / empty-state components render from that state.
 * ═══════════════════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useContentLibrary } from "./_hooks/useContentLibrary";
import type { LibraryTab } from "./_components/LibraryToolbar";
import { ContentLibraryView } from "./_components/ContentLibraryView";

export default function LibraryPage() {
  // ?tab= is read once via useSearchParams so overview CTAs (and external
  // deep-links) can land the user on a narrower tab. Evaluated inside a
  // useMemo so changing tabs client-side doesn't force a re-seed.
  const params = useSearchParams();
  const initialTab = useMemo<LibraryTab>(() => {
    const t = params.get('tab');
    return isValidTab(t) ? (t as LibraryTab) : 'all';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const state = useContentLibrary({ initialTab });

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
          <h1 className="swa-page-title">Content Created</h1>
          <p className="swa-page-subtitle">
            Every article, newsletter, and social post the pipeline has
            produced — searchable in one place. Use the tabs to narrow by
            status, or switch tabs to see rejected / archived items.
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

function isValidTab(t: string | null | undefined): t is LibraryTab {
  return t === 'all' || t === 'drafts' || t === 'verified' || t === 'rejected' || t === 'archived';
}
