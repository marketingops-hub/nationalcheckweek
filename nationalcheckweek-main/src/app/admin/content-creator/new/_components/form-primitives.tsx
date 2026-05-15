"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * Shared form primitives for the New Brief page.
 *
 * Kept separate so BriefForm stays focused on fields, not layout atoms,
 * and so the inputStyle object has exactly one canonical definition.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { CSSProperties, ReactNode } from "react";

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: 'inherit',
  background: '#fff',
};

export function Field({
  label, hint, required, children,
}: {
  label:    string;
  hint?:    string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{
        fontSize: 12, fontWeight: 700, color: '#374151',
        textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
        {label}{required ? ' *' : ''}
      </span>
      {children}
      {hint && <span style={{ fontSize: 12, color: '#9CA3AF' }}>{hint}</span>}
    </label>
  );
}
