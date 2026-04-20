"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/content-creator/drafts
 *
 * Stage 2 output. Rows here have status ∈ {draft, verifying, rejected}.
 * Bulk selection supports archiving but not approve/generate (already done).
 * Opening a draft leads to /admin/content-creator/[id] for editing + verify.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { StageList } from "@/components/content-creator/StageList";

export default function DraftsPage() {
  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Drafts</h1>
          <p className="swa-page-subtitle">
            Stage 2 output. Edit the body, then Verify against the Vault.
          </p>
        </div>
      </div>
      <StageList stageKey="drafts" />
    </div>
  );
}
