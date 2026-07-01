"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/content-creator/[id]
 *
 * Single-draft detail page — now a thin orchestrator after the Apr 2026
 * refactor. Behaviour is unchanged; the file-size regression was fixed by
 * pushing state + actions into `_hooks/useDraftDetail` and splitting the
 * UI into four colocated components:
 *
 *   _components/DraftHeader.tsx        — breadcrumb + title + top actions
 *   _components/DraftBodyEditor.tsx    — title input + textarea + action row
 *   _components/DraftSpinner.tsx       — in-flight indicator
 *   _components/VerificationPanel.tsx  — Claude verifier's verdict
 *   _components/MetaPanel.tsx          — provenance + drift warnings + last error
 *
 * Status-derived flags (`isEditable`, `inFlight`) stay here because that's
 * the single place where the raw draft is in scope and both child
 * components need the same computed values.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useParams } from "next/navigation";
import { reviewState } from "@/lib/content-creator/types";
import { useDraftDetail } from "./_hooks/useDraftDetail";
import { DraftHeader }         from "./_components/DraftHeader";
import { DraftBodyEditor }     from "./_components/DraftBodyEditor";
import { VerificationPanel }   from "./_components/VerificationPanel";
import { MetaPanel }           from "./_components/MetaPanel";
import { BriefSettingsPanel }  from "./_components/BriefSettingsPanel";

export default function DraftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const d = useDraftDetail(id);

  if (d.loading) return <div style={{ padding: 40, color: '#9CA3AF' }}>Loading…</div>;
  if (!d.draft)  return <div className="swa-alert swa-alert--error">Draft not found.</div>;

  // Status-derived flags live here because both editor and header branch
  // on them. Keeping them in one place guarantees both components agree.
  const isEditable =
    d.draft.status === 'draft' ||
    d.draft.status === 'rejected' ||
    d.draft.status === 'approved_idea' ||
    d.draft.status === 'idea' ||
    // verified edits demote the draft back to `draft` server-side.
    d.draft.status === 'verified';

  const inFlight =
    d.busy !== null ||
    d.draft.status === 'generating' ||
    d.draft.status === 'verifying';

  return (
    <div>
      <DraftHeader
        draft={d.draft}
        onUnapprove={d.doUnapprove}
        onArchive={d.doArchive}
        onDelete={d.doDelete}
      />

      {d.error && (
        <div
          className={`swa-alert ${d.error === 'Copied to clipboard' ? 'swa-alert--success' : 'swa-alert--error'}`}
          style={{ marginBottom: 20 }}
        >
          {d.error}
        </div>
      )}

      {(() => {
        const rs = reviewState(d.draft);
        if (rs === 'none') return null;
        const v = d.draft.verification;
        const style =
          rs === 'approved' ? { bg: '#ECFDF5', border: '#A7F3D0', color: '#065F46' }
          : rs === 'rejected' ? { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B' }
          : { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' };
        return (
          <div style={{
            marginBottom: 20, padding: '10px 14px', borderRadius: 8,
            background: style.bg, border: `1px solid ${style.border}`, color: style.color, fontSize: 13,
          }}>
            {rs === 'pending' && <><strong>Submitted for review</strong> — pending approval.</>}
            {rs === 'approved' && <><strong>Approved</strong>{v?.approved_by ? <> by {v.approved_by}</> : null}.</>}
            {rs === 'rejected' && (
              <><strong>Sent back in review.</strong>{v?.rejection_reason ? <> Reason: {v.rejection_reason}</> : null} Revise, then click <em>Resubmit for review</em>.</>
            )}
          </div>
        );
      })()}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Retarget controls live above the editor so the admin can change
              "what am I writing?" before hitting Generate / Regenerate. */}
          <BriefSettingsPanel
            draft={d.draft}
            disabled={inFlight}
            onSave={d.patchMeta}
          />

          <DraftBodyEditor
            draft={d.draft}
            title={d.title}
            body={d.body}
            onTitleChange={d.setTitle}
            onBodyChange={d.setBody}
            isEditable={isEditable}
            inFlight={inFlight}
            busy={d.busy}
            stuck={d.stuck}
            stuckAfterSeconds={d.stuckAfterSeconds}
            onGenerate={d.doGenerate}
            onSave={d.doSave}
            onVerify={d.doVerify}
            onFinalize={d.doFinalize}
            onRegenerate={d.doRegenerate}
            onCopy={d.copyBody}
            onDownload={d.downloadMd}
            onPublishToBlog={d.doPublishToBlog}
            onPublishToPages={d.doPublishToPages}
            onRetryStuck={d.retryFromStuck}
            onSubmitReview={d.doSubmitReview}
          />
        </div>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <VerificationPanel draft={d.draft} />
          <MetaPanel         draft={d.draft} />
        </aside>
      </div>
    </div>
  );
}
