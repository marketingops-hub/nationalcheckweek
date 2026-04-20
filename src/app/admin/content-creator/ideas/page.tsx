"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/content-creator/ideas
 *
 * Stage 1 output. Rows here have status ∈ {idea, approved_idea, generating}.
 * This is the only stage that supports bulk approve + bulk generate because
 * those are the only transitions meaningful from this state.
 * ═══════════════════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { StageList } from "@/components/content-creator/StageList";

export default function IdeasPage() {
  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Ideas</h1>
          <p className="swa-page-subtitle">
            Stage 1 output. Approve ideas worth pursuing, then generate full content.
          </p>
        </div>
        <Link href="/admin/content-creator/new" className="swa-btn swa-btn--primary">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          New Brief
        </Link>
      </div>
      <StageList stageKey="ideas" />
    </div>
  );
}
