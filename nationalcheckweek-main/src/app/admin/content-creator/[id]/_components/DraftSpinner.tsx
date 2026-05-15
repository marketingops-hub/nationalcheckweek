"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * DraftSpinner — in-flight indicator shown while an edge fn is running.
 *
 * The @keyframes rule is co-located in a <style> tag because it's only
 * used here and the project has no global "animations" stylesheet.
 * ═══════════════════════════════════════════════════════════════════════════ */

export function DraftSpinner({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4338CA', fontSize: 14 }}>
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 18, animation: 'cc-spin 1.2s linear infinite' }}
      >
        progress_activity
      </span>
      {label}
      <style>{`@keyframes cc-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
