"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * DraftBodyEditor — the big editing surface + stage-specific action row.
 *
 * Renders, in order:
 *   1. Title input (long-form only, and only when the brief's include_title
 *      flag isn't explicitly false).
 *   2. Body textarea (row count adapts to content_type).
 *   3. Char counter with turn-red-over-limit behaviour for social.
 *   4. Stage-specific action row. The action row has grown beyond what
 *      a single buttonbar comfortably fits, so we split it:
 *        - Primary actions (Generate, Save, Verify, Finalize, Copy, …)
 *        - "Request improvement" — a collapsible panel with a feedback
 *          textarea. Opens inline so the admin doesn't lose scroll
 *          position or the current draft contents.
 *
 * Status → action mapping (covers the two-step verify/finalize flow):
 *
 *   idea / approved_idea    → Generate
 *   draft / rejected        → Save · Verify · Request improvement
 *   verified (unfinalized)  → Finalize · Copy · Download · Request improvement · Edit
 *   verified (finalized)    → Copy · Download · Reopen for edits (demotes)
 *   generating / verifying  → <DraftSpinner />
 *   stuck                   → <StuckBanner />
 *
 * `isEditable` is computed in the parent because it's status-derived and
 * we want the parent hook to own all status logic.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import type { ContentDraft } from "@/lib/content-creator/types";
import { PLATFORM_CONFIG } from "@/lib/content-creator/platforms";
import { DraftSpinner } from "./DraftSpinner";

/** Preset improvement prompts. Picking one appends its text to the
 *  feedback textarea so the admin can stack multiple quick-fixes and
 *  still add bespoke notes. Order matches the user's Apr-2026 spec. */
const FEEDBACK_PRESETS: readonly { label: string; text: string }[] = [
  { label: 'More in-depth',           text: 'Go more in-depth on each point — add a concrete example or data point from the Vault for every claim.' },
  { label: 'Longer',                  text: 'Make this longer. Expand the analysis and add more supporting detail without introducing new claims.' },
  { label: 'Research more',           text: 'Draw on more Vault sources. Include additional evidence and cross-reference multiple entries where possible.' },
  { label: 'More professional',       text: 'Tighten the tone — more formal, remove colloquialisms and filler, keep the voice authoritative and evidence-led.' },
  { label: 'Reduce sources',          text: 'Use fewer Vault sources. Consolidate to the two or three strongest citations and drop the rest.' },
  { label: 'Without sources',         text: 'Rewrite without citing any sources. Preserve every factual claim as a plain statement — no [Source N] or [vault:…] markers.' },
];

export type EditorBusy =
  | null | 'generate' | 'verify' | 'save' | 'finalize' | 'regenerate' | 'meta' | 'publish';

export interface DraftBodyEditorProps {
  draft:        ContentDraft;
  title:        string;
  body:         string;
  onTitleChange: (t: string) => void;
  onBodyChange:  (b: string) => void;
  isEditable:   boolean;
  inFlight:     boolean;
  busy:         EditorBusy;
  stuck:        boolean;
  stuckAfterSeconds: number;

  onGenerate:   () => void;
  onSave:       () => void;
  onVerify:     () => void;
  onFinalize:   () => void;
  onRegenerate: (feedback: string) => void;
  onCopy:       () => void;
  onDownload:   () => void;
  onPublishToBlog:  () => void;
  /** GEO-only mirror of onPublishToBlog — pushes into cms_pages. */
  onPublishToPages: () => void;
  onRetryStuck: () => void | Promise<void>;
}

export function DraftBodyEditor(props: DraftBodyEditorProps) {
  const {
    draft, title, body, onTitleChange, onBodyChange,
    isEditable, inFlight, busy, stuck, stuckAfterSeconds,
    onGenerate, onSave, onVerify, onFinalize, onRegenerate,
    onCopy, onDownload, onPublishToBlog, onPublishToPages, onRetryStuck,
  } = props;

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback]         = useState("");

  const charLimit = draft.content_type === 'social' && draft.platform
    ? PLATFORM_CONFIG[draft.platform]?.maxChars
    : undefined;

  // Title visibility mirrors the generate-stage logic so the editor shows
  // exactly what will be produced: social never has one; long-form is
  // governed by the brief's include_title flag (default true).
  const showTitle =
    draft.content_type !== 'social' &&
    (draft.brief?.include_title ?? true);

  const isFinalized = !!draft.verification?.approved_at;

  async function submitFeedback() {
    const text = feedback.trim();
    if (text.length < 3) return;
    setFeedbackOpen(false);
    setFeedback("");
    // Fire-and-forget; the hook handles errors.
    onRegenerate(text);
  }

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E5E7EB',
      borderRadius: 12,
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      {/* GEO-only: compact chip strip so the admin can see at a glance
          which town + issue this draft is anchored to. Slugs come from
          the brief where the /api/admin/content-creator/geo route
          stored them at create time. */}
      {draft.content_type === 'geo' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {draft.brief?.area_slug && (
            <span style={{
              background: '#EEF2FF', color: '#3730A3', fontSize: 12, fontWeight: 600,
              padding: '4px 10px', borderRadius: 999,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13, verticalAlign: '-2px', marginRight: 4 }}>location_on</span>
              Area: {String(draft.brief.area_slug)}
            </span>
          )}
          {draft.brief?.issue_slug && (
            <span style={{
              background: '#FEF3C7', color: '#92400E', fontSize: 12, fontWeight: 600,
              padding: '4px 10px', borderRadius: 999,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13, verticalAlign: '-2px', marginRight: 4 }}>psychology</span>
              Issue: {String(draft.brief.issue_slug)}
            </span>
          )}
        </div>
      )}

      {showTitle && (
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          disabled={!isEditable || inFlight}
          placeholder="Title"
          style={{
            fontSize: 22,
            fontWeight: 700,
            padding: '10px 12px',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            color: '#1E1040',
          }}
        />
      )}

      <textarea
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
        disabled={!isEditable || inFlight}
        rows={draft.content_type === 'social' ? 6 : 18}
        placeholder={
          draft.status === 'idea'
            ? 'This is the idea summary. Approve + Generate to produce full content.'
            : 'Write / edit the body here. Every claim must be backed by a Vault entry.'
        }
        style={{
          padding: '12px 14px',
          border: '1px solid #E5E7EB',
          borderRadius: 8,
          fontSize: 14,
          fontFamily: 'inherit',
          lineHeight: 1.6,
          resize: 'vertical',
          minHeight: 180,
        }}
      />

      {charLimit && (
        <div style={{ fontSize: 12, color: body.length > charLimit ? '#B91C1C' : '#6B7280' }}>
          {body.length} / {charLimit} chars
        </div>
      )}

      {/* Finalized banner — locks the primary-action row into "copy / reopen". */}
      {isFinalized && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10,
          padding: '10px 14px',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#047857' }}>
            verified
          </span>
          <div style={{ fontSize: 13, color: '#065F46', lineHeight: 1.4 }}>
            <strong>Finalized.</strong>{' '}
            Ready to publish. Reopen to edit — that demotes the draft and
            clears the finalization flag.
          </div>
        </div>
      )}

      {/* Primary action row. One wrapping row; buttons are small/medium so
          they flow nicely on narrow widths without an overflow menu. */}
      <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>

        {(draft.status === 'idea' || draft.status === 'approved_idea') && (
          <button onClick={onGenerate} disabled={inFlight} className="swa-btn swa-btn--primary">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_awesome</span>
            {busy === 'generate' ? 'Generating…' : 'Generate content'}
          </button>
        )}

        {(draft.status === 'draft' || draft.status === 'rejected') && (
          <>
            <button onClick={onSave} disabled={inFlight} className="swa-btn">
              {busy === 'save' ? 'Saving…' : 'Save'}
            </button>
            <button onClick={onVerify} disabled={inFlight} className="swa-btn swa-btn--primary">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>fact_check</span>
              {busy === 'verify' ? 'Verifying…' : 'Verify against Vault'}
            </button>
            <button
              onClick={() => setFeedbackOpen((v) => !v)}
              disabled={inFlight}
              className="swa-btn"
              title="Ask the AI to rewrite this draft with your feedback"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                {feedbackOpen ? 'expand_less' : 'refresh'}
              </span>
              Request improvement
            </button>
          </>
        )}

        {draft.status === 'verified' && !isFinalized && (
          <>
            <button onClick={onFinalize} disabled={inFlight} className="swa-btn swa-btn--primary">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>task_alt</span>
              {busy === 'finalize' ? 'Finalizing…' : 'Approve & finalize'}
            </button>
            <button onClick={onCopy} className="swa-btn">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>content_copy</span>
              Copy
            </button>
            <button onClick={onDownload} className="swa-btn">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
              Download
            </button>
            <button
              onClick={() => setFeedbackOpen((v) => !v)}
              disabled={inFlight}
              className="swa-btn"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                {feedbackOpen ? 'expand_less' : 'refresh'}
              </span>
              Request improvement
            </button>
            <button onClick={onSave} className="swa-btn" title="Edit demotes the draft back so it can be changed">
              Edit (demotes to draft)
            </button>
          </>
        )}

        {draft.status === 'verified' && isFinalized && (
          <>
            <button onClick={onCopy} className="swa-btn swa-btn--primary">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>content_copy</span>
              Copy
            </button>
            <button onClick={onDownload} className="swa-btn">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
              Download .md
            </button>
            {/* Blog-only: push this finalized draft to /admin/blog as an
                unpublished draft. Rendered next to Download so it reads as
                a natural sibling of the export actions. */}
            {draft.content_type === 'blog' && (
              <button
                onClick={onPublishToBlog}
                disabled={inFlight}
                className="swa-btn"
                title="Creates (or updates) a matching row in /admin/blog. You then toggle it live from there."
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>publish</span>
                {busy === 'publish' ? 'Publishing…' : 'Publish to /admin/blog'}
              </button>
            )}
            {/* GEO-only: push to cms_pages with category='geo'. Same
                idempotent insert/update semantics as publish-to-blog. */}
            {draft.content_type === 'geo' && (
              <button
                onClick={onPublishToPages}
                disabled={inFlight}
                className="swa-btn"
                title="Creates (or updates) a matching row in /admin/cms/pages under the GEO pages category. You then toggle it live from there."
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>publish</span>
                {busy === 'publish' ? 'Publishing…' : 'Publish to /admin/cms/pages'}
              </button>
            )}
            <button onClick={onSave} className="swa-btn">
              Reopen for edits
            </button>
          </>
        )}

        {draft.status === 'generating' && !stuck && <DraftSpinner label={busy === 'regenerate' ? 'Rewriting draft with your feedback…' : 'Writing draft…'} />}
        {draft.status === 'verifying'  && !stuck && <DraftSpinner label="Checking claims against Vault…" />}

        {stuck && (
          <div style={{
            width: '100%', padding: 12, background: '#FEF2F2',
            borderRadius: 8, color: '#991B1B', fontSize: 13,
          }}>
            <strong>Still processing after {stuckAfterSeconds}s.</strong> The AI call may have stalled.
            <button
              onClick={onRetryStuck}
              className="swa-btn"
              style={{ marginLeft: 8 }}
            >
              Check again
            </button>
          </div>
        )}
      </div>

      {/* Request-improvement drawer. Appears inline under the action row. */}
      {feedbackOpen && !inFlight && (
        <div style={{
          background: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: 10,
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#5925F4' }}>
              psychology
            </span>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1E1040', letterSpacing: 0.3 }}>
              What should the AI fix?
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>
            The model will read your current draft and rewrite it to address
            these notes, staying grounded in the Vault. Be specific — &ldquo;shorter
            intro, punchier CTA, drop the loneliness stat&rdquo; beats &ldquo;make it better&rdquo;.
          </p>

          {/* Preset picker — appends the chosen preset's text to the feedback
              textarea so the admin can stack them. Resets the select back to
              empty after each pick so a preset can be added twice if needed. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>
              Quick preset:
            </label>
            <select
              value=""
              onChange={(e) => {
                const preset = FEEDBACK_PRESETS.find((p) => p.label === e.target.value);
                if (!preset) return;
                setFeedback((prev) => {
                  // Separate with a blank line when stacking onto existing
                  // text, otherwise drop the preset in clean.
                  const sep = prev.trim().length > 0 ? '\n\n' : '';
                  return (prev + sep + preset.text).slice(0, 2000);
                });
              }}
              style={{
                padding: '6px 10px',
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                fontSize: 12,
                background: '#fff',
                color: '#1E1040',
                cursor: 'pointer',
              }}
            >
              <option value="">Choose a preset…</option>
              {FEEDBACK_PRESETS.map((p) => (
                <option key={p.label} value={p.label}>{p.label}</option>
              ))}
            </select>
          </div>

          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="e.g. Tighten the opening; add one more data point from the Vault; drop the self-referential ending."
            style={{
              padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8,
              fontSize: 13, fontFamily: 'inherit', lineHeight: 1.5, resize: 'vertical',
              minHeight: 80, background: '#fff',
            }}
          />
          <div style={{
            display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>
              {feedback.length}/2000 — min 3 characters
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="swa-btn"
                onClick={() => { setFeedbackOpen(false); setFeedback(""); }}
                style={{ fontSize: 12, padding: '6px 12px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="swa-btn swa-btn--primary"
                onClick={submitFeedback}
                disabled={feedback.trim().length < 3}
                style={{ fontSize: 12, padding: '6px 12px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  auto_awesome
                </span>
                Rewrite with feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
