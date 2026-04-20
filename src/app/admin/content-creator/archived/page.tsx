"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/content-creator/archived
 *
 * Soft-deleted drafts. Kept for audit. Rows are read-only from the list.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { StageList } from "@/components/content-creator/StageList";

export default function ArchivedPage() {
  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Archived</h1>
          <p className="swa-page-subtitle">
            Soft-deleted drafts. Retained for audit; not visible in other stages.
          </p>
        </div>
      </div>
      <StageList stageKey="archived" />
    </div>
  );
}
