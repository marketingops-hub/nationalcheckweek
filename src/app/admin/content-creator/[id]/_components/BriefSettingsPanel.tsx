"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * BriefSettingsPanel — "what am I writing?" controls.
 *
 * Sits above the body editor. Lets the admin retarget the draft:
 *   - Content type   (blog / newsletter / social)
 *   - Platform       (only when content_type = social)
 *   - Include title  (only for long-form)
 *   - Writing style  (fetched from /api/admin/content-creator/styles)
 *
 * Opinionated UX notes:
 *   - All four controls sit in a single card, one row per concern, so
 *     changes feel like quick switches rather than a form.
 *   - The Save button appears only when something has actually changed
 *     (local state ≠ draft state), keeping idle-state noise to zero.
 *   - Disabled entirely when the draft is mid-AI-flight (generating /
 *     verifying) — you can't retarget a row whose next write is already
 *     in flight. The parent handles this via the `disabled` prop.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useState } from "react";
import type {
  ContentDraft, ContentType, SocialPlatform,
} from "@/lib/content-creator/types";
import { listStyles, type WritingStyle } from "@/lib/content-creator/styles";
import type { BriefMetaPatch } from "../_hooks/useDraftDetail";

const PLATFORMS: SocialPlatform[] = ['twitter', 'linkedin', 'facebook', 'instagram'];

export interface BriefSettingsPanelProps {
  draft:    ContentDraft;
  disabled: boolean;
  /** Called when the admin hits Save. Returns true if the server accepted
   *  the patch — we close the "dirty" affordance only on success. */
  onSave:   (patch: BriefMetaPatch) => Promise<boolean>;
}

export function BriefSettingsPanel({ draft, disabled, onSave }: BriefSettingsPanelProps) {
  /* ─── Local editable state mirrors the draft ─────────────────────────── */

  const [contentType,  setContentType]  = useState<ContentType>(draft.content_type);
  const [platform,     setPlatform]     = useState<SocialPlatform | null>(draft.platform);
  const [includeTitle, setIncludeTitle] = useState<boolean>(
    // Undefined in the brief is treated as "include" for back-compat with
    // drafts generated before the toggle existed.
    draft.brief?.include_title ?? true,
  );
  const [styleId,      setStyleId]      = useState<string>(draft.brief?.style_id ?? "");

  // Re-seed local state whenever the draft changes from underneath us
  // (e.g. polling picks up the result of someone else's patch).
  useEffect(() => {
    setContentType(draft.content_type);
    setPlatform(draft.platform);
    setIncludeTitle(draft.brief?.include_title ?? true);
    setStyleId(draft.brief?.style_id ?? "");
  }, [draft.content_type, draft.platform, draft.brief?.include_title, draft.brief?.style_id]);

  /* ─── Style list — fetched per content_type, non-critical if it fails ──
   *
   * Scoped to the *local* contentType (not the persisted draft.content_type)
   * so the dropdown updates the instant the admin toggles the segmented
   * control, well before they hit Save. If the currently-selected style
   * doesn't apply to the new type, we clear it; otherwise the Save patch
   * would carry an orphan style_id the edge fn would silently drop. */

  const [styles, setStyles] = useState<WritingStyle[]>([]);
  useEffect(() => {
    listStyles({ active_only: true, applies_to: contentType })
      .then((rows) => {
        setStyles(rows);
        // Clear an orphan selection: the previously-picked style no
        // longer applies to this content type.
        if (styleId && !rows.some((s) => s.id === styleId)) setStyleId("");
      })
      .catch(() => { /* non-critical; dropdown falls back to "(default)" only */ });
    // styleId is intentionally read but not a dep — we only want to
    // re-fetch on content-type changes, and the orphan-clear above uses
    // the latest value from closure at call time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType]);

  /* ─── Dirty check drives the Save button ─────────────────────────────── */

  const dirty = useMemo(() => {
    if (contentType !== draft.content_type) return true;
    if ((platform ?? null) !== (draft.platform ?? null)) return true;
    const wasIncludeTitle = draft.brief?.include_title ?? true;
    if (includeTitle !== wasIncludeTitle) return true;
    const wasStyleId = draft.brief?.style_id ?? "";
    if (styleId !== wasStyleId) return true;
    return false;
  }, [contentType, platform, includeTitle, styleId, draft]);

  /* ─── Type swap sanitisation ─────────────────────────────────────────── */

  // Switching TO social? Clamp platform to a sensible default so the
  // submit can't 400. Switching AWAY from social? Wipe the platform field.
  function onChangeContentType(next: ContentType) {
    setContentType(next);
    if (next === 'social') {
      setPlatform(platform ?? 'linkedin');
      setIncludeTitle(false);          // moot for social but keeps state tidy
    } else {
      setPlatform(null);
    }
  }

  async function onClickSave() {
    const patch: BriefMetaPatch = {};
    if (contentType !== draft.content_type)        patch.content_type  = contentType;
    if ((platform ?? null) !== (draft.platform ?? null)) patch.platform = platform;
    if (contentType !== 'social'
        && includeTitle !== (draft.brief?.include_title ?? true)) {
      patch.include_title = includeTitle;
    }
    if (styleId !== (draft.brief?.style_id ?? "")) {
      patch.style_id = styleId || null;
    }
    const ok = await onSave(patch);
    // Parent owns the authoritative state; nothing to do on success. On
    // failure we stay dirty so the admin can retry or discard.
    void ok;
  }

  function onClickReset() {
    setContentType(draft.content_type);
    setPlatform(draft.platform);
    setIncludeTitle(draft.brief?.include_title ?? true);
    setStyleId(draft.brief?.style_id ?? "");
  }

  /* ─── Render ─────────────────────────────────────────────────────────── */

  return (
    <div style={{
      background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
      padding: 18, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#5925F4' }}>
          tune
        </span>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1040', margin: 0, letterSpacing: 0.3 }}>
          Brief settings
        </h2>
        {dirty && !disabled && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
            background: '#FEF3C7', color: '#92400E',
            textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 'auto',
          }}>
            Unsaved changes
          </span>
        )}
      </div>

      {/* Row 1: content type segmented control */}
      <FieldRow label="Content type">
        <SegmentedControl<ContentType>
          value={contentType}
          options={[
            { value: 'blog',       label: 'Blog post',  icon: 'article' },
            { value: 'newsletter', label: 'Newsletter', icon: 'mail' },
            { value: 'social',     label: 'Social',     icon: 'share' },
          ]}
          onChange={onChangeContentType}
          disabled={disabled}
        />
      </FieldRow>

      {/* Row 2: platform (conditional on social) */}
      {contentType === 'social' && (
        <FieldRow label="Platform">
          <select
            value={platform ?? 'linkedin'}
            onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
            disabled={disabled}
            style={selectStyle}
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </FieldRow>
      )}

      {/* Row 3: include-title (long-form only) */}
      {contentType !== 'social' && (
        <FieldRow label="Title">
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 13, color: '#374151', cursor: disabled ? 'not-allowed' : 'pointer',
          }}>
            <input
              type="checkbox"
              checked={includeTitle}
              onChange={(e) => setIncludeTitle(e.target.checked)}
              disabled={disabled}
            />
            Include a title on this {contentType}
          </label>
        </FieldRow>
      )}

      {/* Row 4: writing style */}
      <FieldRow label="Writing style">
        <select
          value={styleId}
          onChange={(e) => setStyleId(e.target.value)}
          disabled={disabled}
          style={selectStyle}
        >
          <option value="">(default voice)</option>
          {styles.map((s) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
      </FieldRow>

      {/* Action row — only shown when dirty */}
      {dirty && (
        <div style={{
          display: 'flex', gap: 8, justifyContent: 'flex-end',
          paddingTop: 8, borderTop: '1px solid #F3F4F6', marginTop: 2,
        }}>
          <button
            type="button"
            className="swa-btn"
            onClick={onClickReset}
            disabled={disabled}
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            Discard
          </button>
          <button
            type="button"
            className="swa-btn swa-btn--primary"
            onClick={onClickSave}
            disabled={disabled}
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            Save settings
          </button>
        </div>
      )}

      {/* Helper text — only shown when the admin is retargeting type.
          Explains the content-level implications so nothing surprises them. */}
      {contentType !== draft.content_type && (
        <div style={{
          fontSize: 11, color: '#6B7280', background: '#F9FAFB',
          borderRadius: 8, padding: 10, lineHeight: 1.5,
        }}>
          <strong style={{ color: '#374151' }}>Heads up:</strong>{' '}
          Changing to <strong>{contentType}</strong> takes effect on the next
          generate / regenerate run. Current body + title stay untouched
          until then.
        </div>
      )}
    </div>
  );
}

/* ─── Local primitives ─────────────────────────────────────────────────── */

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, alignItems: 'center',
    }}>
      <span style={{
        fontSize: 11, fontWeight: 700, color: '#6B7280',
        textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: '7px 10px', borderRadius: 8,
  border: '1px solid #D1D5DB', fontSize: 13,
  background: '#fff', color: '#1E1040',
  cursor: 'pointer', minWidth: 180,
};

/* ─── Segmented control ────────────────────────────────────────────────── */

interface SegOption<T extends string> { value: T; label: string; icon: string }

function SegmentedControl<T extends string>({
  value, options, onChange, disabled,
}: {
  value:    T;
  options:  SegOption<T>[];
  onChange: (v: T) => void;
  disabled: boolean;
}) {
  return (
    <div
      role="radiogroup"
      style={{
        display: 'inline-flex',
        background: '#F3F4F6',
        borderRadius: 10,
        padding: 3,
        gap: 2,
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
            style={{
              padding: '6px 14px',
              border: 'none',
              borderRadius: 8,
              background: active ? '#fff' : 'transparent',
              color:      active ? '#1E1040' : '#6B7280',
              fontSize: 12,
              fontWeight: 600,
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              boxShadow: active ? '0 1px 2px rgba(16,24,40,0.08)' : undefined,
              transition: 'background 120ms ease, color 120ms ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              {o.icon}
            </span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
