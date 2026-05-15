"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * Form primitives for the Styles page.
 *
 * Separate from the New Brief page's primitives because the inline-edit
 * card on this page uses `display: block` labels (stacked vertically
 * inside a 2-col grid) whereas the brief form uses flex-column labels.
 * Keeping them distinct avoids a props-explosion in a shared helper.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { CSSProperties, ReactNode } from "react";

export const inputStyle: CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid #D1D5DB', fontSize: 14, boxSizing: 'border-box',
};

export function Field({
  label, hint, children,
}: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <div style={{
        fontSize: 12, fontWeight: 700, color: '#374151',
        marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
        {label}
      </div>
      {children}
      {hint && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{hint}</div>}
    </label>
  );
}
