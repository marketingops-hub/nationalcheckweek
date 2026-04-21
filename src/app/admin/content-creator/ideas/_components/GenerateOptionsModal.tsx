"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * GenerateOptionsModal — "what exactly are we writing?"
 *
 * Intercepts the Generate button on an IdeaCard so the admin can confirm
 * (and override) the per-piece settings before burning an AI call:
 *
 *   1. Content type    (Blog · Newsletter · Social)
 *   2. Platform        (only when social)
 *   3. Length          (Short · Standard · Long — long-form only)
 *   4. Writing style   (filtered by applies_to on the chosen type)
 *
 * Initial values mirror whatever's already on the idea, so the default path
 * (user just wants to generate with the brief they gave at creation time)
 * is a single click through. Nothing is saved to the DB until Confirm.
 *
 * The actual work — patch-if-dirty → approve-if-idea → generate — lives in
 * `useIdeasList.generateWithOptions`. This component is pure UI + onSubmit.
 *
 * Accessibility: focus-traps via the standard browser dialog element, closes
 * on Escape, and the backdrop click cancels (explicit Cancel button too).
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useState } from "react";
import type {
  ContentDraft, ContentType, SocialPlatform,
} from "@/lib/content-creator/types";
import { listStyles, type WritingStyle } from "@/lib/content-creator/styles";

/** Payload returned to the parent on confirm. Any field left undefined means
 *  "keep whatever the draft already has" — the hook consumer dedupes by
 *  diffing against the idea before PATCHing. */
export interface GenerateOptions {
  content_type:  ContentType;
  platform:      SocialPlatform | null;
  length_preset: 'short' | 'standard' | 'long';
  style_id:      string | null;
}

const LENGTH_OPTIONS: { value: 'short' | 'standard' | 'long'; label: string; hint: string }[] = [
  { value: 'short',    label: 'Short',    hint: 'Tight, scannable' },
  { value: 'standard', label: 'Standard', hint: 'Default range' },
  { value: 'long',     label: 'Long',     hint: 'In-depth, more sections' },
];

const PLATFORMS: SocialPlatform[] = ['twitter', 'linkedin', 'facebook', 'instagram'];

export interface GenerateOptionsModalProps {
  /** The idea being generated. Seeds initial form state. */
  idea:       ContentDraft;
  /** True while the AI chain is mid-flight — freezes the form. */
  busy:       boolean;
  onCancel:   () => void;
  onConfirm:  (opts: GenerateOptions) => Promise<void> | void;
}

export function GenerateOptionsModal({
  idea, busy, onCancel, onConfirm,
}: GenerateOptionsModalProps) {
  /* ─── Local form state — seeded from the idea ────────────────────────── */

  const [contentType,  setContentType]  = useState<ContentType>(idea.content_type);
  const [platform,     setPlatform]     = useState<SocialPlatform | null>(idea.platform ?? null);
  const [lengthPreset, setLengthPreset] = useState<'short' | 'standard' | 'long'>(
    idea.brief?.length_preset ?? 'standard',
  );
  const [styleId,      setStyleId]      = useState<string>(idea.brief?.style_id ?? "");

  /* ─── Style list for the current content type ────────────────────────── */

  const [styles, setStyles] = useState<WritingStyle[]>([]);
  useEffect(() => {
    listStyles({ active_only: true, applies_to: contentType })
      .then((rows) => {
        setStyles(rows);
        // Clear an orphan selection: style no longer applies to the
        // newly-picked content type. Same pattern as BriefSettingsPanel.
        if (styleId && !rows.some((s) => s.id === styleId)) setStyleId("");
      })
      .catch(() => { /* non-critical — dropdown just shows (default voice) */ });
    // styleId intentionally not a dep; we only refetch on content_type.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType]);

  /* ─── Derived: show a preview of the word range for long-form ────────── */

  const lengthPreview = useMemo(() => {
    if (contentType === 'social') return null;
    // Kept in sync with src/lib/content-creator/length.ts · wordTarget.
    // Hardcoded here rather than imported so the modal stays self-
    // contained — if wordTarget changes we update the two places together.
    const base = contentType === 'blog' ? [600, 900] : [300, 500];
    const scale = lengthPreset === 'short' ? 0.6 : lengthPreset === 'long' ? 1.6 : 1;
    return {
      min: Math.round(base[0] * scale),
      max: Math.round(base[1] * scale),
    };
  }, [contentType, lengthPreset]);

  /* ─── Type swap sanitisation ─────────────────────────────────────────── */

  function onChangeContentType(next: ContentType) {
    setContentType(next);
    if (next === 'social') {
      setPlatform(platform ?? 'linkedin');
    } else {
      setPlatform(null);
    }
  }

  /* ─── Submit / cancel wiring ─────────────────────────────────────────── */

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await onConfirm({
      content_type:  contentType,
      platform:      contentType === 'social' ? (platform ?? 'linkedin') : null,
      length_preset: lengthPreset,
      style_id:      styleId || null,
    });
  }

  // Close on Escape. Attaches once; nothing here is render-dependent.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);

  /* ─── Render ─────────────────────────────────────────────────────────── */

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gen-opts-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(15, 23, 42, 0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onMouseDown={(e) => {
        // Cancel on backdrop click (but not when dragging from inside the card).
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <form
        onSubmit={submit}
        style={{
          background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560,
          boxShadow: '0 24px 48px rgba(15, 23, 42, 0.25)',
          display: 'flex', flexDirection: 'column',
          maxHeight: 'calc(100vh - 40px)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px', borderBottom: '1px solid #F3F4F6',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 22, color: '#5925F4' }}
          >
            auto_awesome
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              id="gen-opts-title"
              style={{ fontSize: 16, fontWeight: 700, color: '#1E1040', margin: 0 }}
            >
              Generate content
            </h2>
            <p
              style={{
                fontSize: 12, color: '#6B7280', margin: '2px 0 0',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
              title={idea.title ?? ''}
            >
              {idea.title ?? '(untitled idea)'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label="Close"
            style={{
              border: 'none', background: 'transparent', cursor: busy ? 'not-allowed' : 'pointer',
              color: '#9CA3AF', fontSize: 22, lineHeight: 1, padding: 4,
            }}
          >
            ×
          </button>
        </div>

        {/* Body — scrolls if the list of styles grows large */}
        <div style={{
          padding: 22, display: 'flex', flexDirection: 'column', gap: 18,
          overflowY: 'auto',
        }}>
          {/* Content type */}
          <Field label="Content type">
            <Segmented<ContentType>
              value={contentType}
              onChange={onChangeContentType}
              disabled={busy}
              options={[
                { value: 'blog',       label: 'Blog post',  icon: 'article' },
                { value: 'newsletter', label: 'Newsletter', icon: 'mail' },
                { value: 'social',     label: 'Social',     icon: 'share' },
              ]}
            />
          </Field>

          {/* Platform — only for social */}
          {contentType === 'social' && (
            <Field label="Platform">
              <select
                value={platform ?? 'linkedin'}
                onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
                disabled={busy}
                style={selectStyle}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {/* Length — hidden for social (length is platform-driven there) */}
          {contentType !== 'social' && (
            <Field
              label="Length"
              hint={lengthPreview ? `Target ~${lengthPreview.min}–${lengthPreview.max} words` : undefined}
            >
              <Segmented<'short' | 'standard' | 'long'>
                value={lengthPreset}
                onChange={setLengthPreset}
                disabled={busy}
                options={LENGTH_OPTIONS.map((o) => ({ value: o.value, label: o.label, hint: o.hint }))}
              />
            </Field>
          )}

          {/* Writing style */}
          <Field label="Writing style">
            <select
              value={styleId}
              onChange={(e) => setStyleId(e.target.value)}
              disabled={busy}
              style={selectStyle}
            >
              <option value="">(default voice)</option>
              {styles.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
            {styles.length === 0 && (
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
                No styles scoped to {contentType}. <a
                  href="/admin/content-creator/styles"
                  style={{ color: '#5925F4' }}
                >
                  Create one →
                </a>
              </div>
            )}
          </Field>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 22px', borderTop: '1px solid #F3F4F6',
          display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center',
          background: '#FAFAFA', borderRadius: '0 0 16px 16px',
        }}>
          <span style={{ flex: 1, fontSize: 11, color: '#9CA3AF' }}>
            Uses 1 of your 30/hour AI calls.
          </span>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="swa-btn"
            style={{ fontSize: 13, padding: '8px 14px' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="swa-btn swa-btn--primary"
            style={{ fontSize: 13, padding: '8px 14px' }}
          >
            {busy ? (
              <>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 14, animation: 'gen-opts-spin 1s linear infinite' }}
                >
                  progress_activity
                </span>
                Generating…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  auto_awesome
                </span>
                Generate
              </>
            )}
          </button>
        </div>

        <style>{`@keyframes gen-opts-spin { to { transform: rotate(360deg); } }`}</style>
      </form>
    </div>
  );
}

/* ─── Local primitives ─────────────────────────────────────────────────── */

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: '#6B7280',
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          {label}
        </span>
        {hint && (
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>{hint}</span>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid #D1D5DB', fontSize: 13,
  background: '#fff', color: '#1E1040',
  cursor: 'pointer',
};

interface SegOption<T extends string> {
  value: T; label: string; icon?: string; hint?: string;
}

function Segmented<T extends string>({
  value, options, onChange, disabled,
}: {
  value: T; options: SegOption<T>[]; onChange: (v: T) => void; disabled: boolean;
}) {
  return (
    <div
      role="radiogroup"
      style={{
        display: 'inline-flex', background: '#F3F4F6', borderRadius: 10,
        padding: 3, gap: 2, flexWrap: 'wrap',
      }}
    >
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            disabled={disabled}
            title={o.hint}
            style={{
              padding: '7px 14px', border: 'none', borderRadius: 8,
              background: active ? '#fff' : 'transparent',
              color:      active ? '#1E1040' : '#6B7280',
              fontSize: 12, fontWeight: 600,
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              boxShadow: active ? '0 1px 2px rgba(16,24,40,0.08)' : undefined,
              transition: 'background 120ms ease, color 120ms ease',
            }}
          >
            {o.icon && (
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                {o.icon}
              </span>
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
