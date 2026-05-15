"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * StylesEmptyState — first-run message shown when the catalogue is empty.
 *
 * Short and opinionated on purpose: admins typically arrive here from the
 * sidebar and need to understand in one scroll what a style is for.
 * ═══════════════════════════════════════════════════════════════════════════ */

export function StylesEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF' }}>
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 48, display: 'block', marginBottom: 16 }}
      >
        brush
      </span>
      <h3 style={{ color: '#1E1040', marginBottom: 8 }}>No writing styles yet</h3>
      <p style={{ marginBottom: 20 }}>
        Create your first style — e.g. Storytelling, Educational, or Scientific —
        then pick it on the brief form to steer how the AI writes.
      </p>
      <button onClick={onCreate} className="swa-btn swa-btn--primary">
        Create first style
      </button>
    </div>
  );
}
