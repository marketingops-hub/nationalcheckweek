"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/content-creator/ideas
 *
 * Stage 1 output, fully redesigned. Previous iteration used the generic
 * StageList component which rendered ideas as squashed horizontal rows
 * and truncated the one thing that matters (the idea summary) down to
 * an ellipsis. Ideas are creative content — they deserve a card grid.
 *
 * Layout:
 *   1. Page header       — title + subtitle + "New brief" CTA
 *   2. Sticky bulk bar   — only when ≥ 1 idea selected
 *   3. IdeasToolbar      — status tabs with counts + type filter + refresh
 *   4. Card grid OR empty state
 *
 * All fetch / mutate / bulk logic lives in useIdeasList. This file only
 * wires the hook into the UI components.
 * ═══════════════════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { useState } from "react";
import { useIdeasList }       from "./_hooks/useIdeasList";
import { IdeaCard }           from "./_components/IdeaCard";
import { IdeasToolbar }       from "./_components/IdeasToolbar";
import { BulkToolbar }        from "./_components/BulkToolbar";
import { IdeasEmptyState }    from "./_components/IdeasEmptyState";
import { GenerateOptionsModal } from "./_components/GenerateOptionsModal";
import type { ContentDraft } from "@/lib/content-creator/types";

export default function IdeasPage() {
  const d = useIdeasList();

  /* Generate-options modal state.
   *   null           → closed
   *   ContentDraft   → the idea being configured for generation */
  const [modalFor, setModalFor] = useState<ContentDraft | null>(null);
  const [modalBusy, setModalBusy] = useState(false);

  // Hide a row mid-bulk-action so a half-applied bulk doesn't mislead.
  // We disable the card at the row level instead of removing it outright
  // so the grid doesn't reflow in the middle of the run.
  const filtersActive = d.statusFilter !== 'all' || d.typeFilter !== 'all';

  function clearFilters() {
    d.setStatusFilter('all');
    d.setTypeFilter('all');
  }

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Ideas</h1>
          <p className="swa-page-subtitle">
            AI-generated angles pulled from your Vault. Approve the ones worth pursuing,
            then generate full content — each idea becomes a draft.
          </p>
        </div>
        <Link href="/admin/content-creator/new" className="swa-btn swa-btn--primary">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          New brief
        </Link>
      </div>

      <BulkToolbar
        selectedCount={d.selected.size}
        canApproveSelected={d.canApproveSelected}
        allVisibleSelected={d.allVisibleSelected}
        progress={d.bulkBusy}
        onToggleAll={d.selectAllVisible}
        onApprove={d.bulkApprove}
        onGenerate={d.bulkGenerate}
        onArchive={d.bulkArchive}
        onClear={d.clearSelection}
      />

      <IdeasToolbar
        statusFilter={d.statusFilter}
        onStatusChange={d.setStatusFilter}
        counts={d.counts}
        typeFilter={d.typeFilter}
        onTypeChange={d.setTypeFilter}
        totalShowing={d.ideas.length}
        loading={d.loading}
        onRefresh={d.refresh}
      />

      {d.error && (
        <div className="swa-alert swa-alert--error" style={{ marginBottom: 16 }}>
          {d.error}
        </div>
      )}

      {d.loading && d.ideas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
          Loading ideas…
        </div>
      ) : d.ideas.length === 0 ? (
        <IdeasEmptyState
          filtered={filtersActive}
          onClearFilters={clearFilters}
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 14,
          alignItems: 'stretch',
        }}>
          {d.ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              selected={d.selected.has(idea.id)}
              // Only idea + approved_idea may be selected. Mid-generation
              // rows are observably-only.
              selectable={idea.status === 'idea' || idea.status === 'approved_idea'}
              disabled={!!d.bulkBusy}
              onToggleSelect={() => d.toggleSelect(idea.id)}
              onApprove={()      => d.onApprove(idea.id)}
              onUnapprove={()    => d.onUnapprove(idea.id)}
              onGenerate={()     => setModalFor(idea)}
              onArchive={()      => d.onArchive(idea.id)}
              onDelete={()       => d.onDelete(idea.id)}
              onRecover={()      => d.onRecover(idea.id)}
            />
          ))}
        </div>
      )}

      {/* Generate-options modal — rendered outside the grid so it doesn't
          participate in the card layout. Mounts only while an idea is
          selected for configuration. */}
      {modalFor && (
        <GenerateOptionsModal
          idea={modalFor}
          busy={modalBusy}
          onCancel={() => { if (!modalBusy) setModalFor(null); }}
          onConfirm={async (opts) => {
            setModalBusy(true);
            try {
              await d.generateWithOptions(modalFor.id, opts);
              // Only close on success — on failure the error banner above
              // the grid explains what went wrong and the modal stays up.
              setModalFor(null);
            } catch { /* error surfaced via d.error */ }
            finally { setModalBusy(false); }
          }}
        />
      )}
    </div>
  );
}
