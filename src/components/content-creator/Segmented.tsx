"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * Segmented — pill-style radio group used across the Content Creator admin.
 *
 * Extracted Apr-2026 from two near-identical copies in BriefSettingsPanel
 * and GenerateOptionsModal. The two callers previously differed only in
 * imports and a `hint` tooltip on the options, which we now support as
 * a first-class optional field.
 *
 * Keeps inline styles (the admin-wide convention — swa-btn + Material
 * Icons). Does NOT own its spin keyframe or any other animation.
 *
 * Accessibility: rendered as native `<button role="radio">` inside a
 * `role="radiogroup"`, with `aria-checked` on the active option. Disabled
 * state propagates to every button.
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Optional material-symbols name. Rendered inline before the label. */
  icon?: string;
  /** Tooltip on the button, rendered via the native `title` attribute. */
  hint?: string;
}

export interface SegmentedProps<T extends string> {
  value:    T;
  options:  SegmentedOption<T>[];
  onChange: (v: T) => void;
  disabled?: boolean;
}

export function Segmented<T extends string>({
  value, options, onChange, disabled = false,
}: SegmentedProps<T>) {
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
