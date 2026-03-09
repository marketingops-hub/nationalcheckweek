/**
 * Shared Tailwind class strings and inline style objects for admin form inputs.
 * Defined here as module-level constants so they are not recreated on every render.
 */
import type { CSSProperties } from "react";

/** Base Tailwind classes applied to every admin text input, select, and textarea. */
export const INPUT_CLS =
  "w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all";

/** Normal (no error) input style. */
export const INPUT_STYLE: CSSProperties = {
  background: "#fff",
  border: "1px solid var(--admin-border-strong)",
  color: "var(--admin-text-primary)",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};

/** Error state input style. */
export const INPUT_ERR_STYLE: CSSProperties = {
  background: "#fff",
  border: "1px solid var(--admin-danger)",
  color: "var(--admin-text-primary)",
  boxShadow: "0 0 0 3px rgba(220,38,38,0.12)",
};

/** Tailwind class string for form field labels. */
export const LABEL_CLS =
  "block text-xs font-semibold mb-1.5 uppercase tracking-wide";

/** Inline style for form field labels. */
export const LABEL_STYLE: CSSProperties = { color: "var(--admin-text-subtle)" };

/**
 * Returns the appropriate input style based on whether the field has an error.
 * Use instead of a ternary on every input.
 */
export function inputStyle(hasError: boolean): CSSProperties {
  return hasError ? INPUT_ERR_STYLE : INPUT_STYLE;
}
