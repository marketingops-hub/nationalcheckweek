"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/content-creator/verified
 *
 * Stage 3 output — content that has passed vault verification. Read-only
 * from this list; opening a row surfaces Copy / Download. Editing demotes
 * back to draft (handled by the detail page).
 * ═══════════════════════════════════════════════════════════════════════════ */

import { StageList } from "@/components/content-creator/StageList";

export default function VerifiedPage() {
  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Verified</h1>
          <p className="swa-page-subtitle">
            Every claim traced to a Vault entry. Ready for the team to copy or download.
          </p>
        </div>
      </div>
      <StageList stageKey="verified" />
    </div>
  );
}
