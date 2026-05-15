"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/content-creator/styles
 *
 * CRUD for writing styles — reusable prompt fragments that steer the voice
 * of every generated idea and draft.
 *
 * Thin orchestrator after the Apr 2026 refactor. UI pieces live in:
 *   _components/StyleRow.tsx           — list row
 *   _components/StyleForm.tsx          — inline create/edit card
 *   _components/StylesEmptyState.tsx   — first-run message
 *   _components/form-primitives.tsx    — Field + inputStyle
 *
 * `formFor` is the one piece of UI state worth calling out:
 *   null   → form closed (all rows render as StyleRow)
 *   'new'  → create form at the top of the list
 *   <id>   → that particular row swaps to an edit form in-place
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  listStyles, createStyle, patchStyle, deleteStyle,
  type WritingStyle, type CreateStyleInput,
} from "@/lib/content-creator/styles";
import { StyleRow }           from "./_components/StyleRow";
import { StyleForm }          from "./_components/StyleForm";
import { StylesEmptyState }   from "./_components/StylesEmptyState";

/** sort_order first, then alphabetical. Matches the DB index on
 *  (sort_order, title). Kept here because it's the only consumer. */
function sortStyles(a: WritingStyle, b: WritingStyle) {
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
  return a.title.localeCompare(b.title);
}

export default function StylesPage() {
  const [styles,  setStyles]  = useState<WritingStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [formFor, setFormFor] = useState<null | 'new' | string>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listStyles();
      setStyles(data);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function onCreate(input: CreateStyleInput) {
    const s = await createStyle(input);
    setStyles((prev) => [...prev, s].sort(sortStyles));
    setFormFor(null);
  }

  async function onUpdate(id: string, input: CreateStyleInput) {
    const s = await patchStyle(id, input);
    setStyles((prev) => prev.map((x) => (x.id === id ? s : x)).sort(sortStyles));
    setFormFor(null);
  }

  async function onDelete(s: WritingStyle) {
    if (!confirm(
      `Delete "${s.title}" permanently?\n\n` +
      `Drafts already generated with this style keep working — they just lose the style metadata.`,
    )) return;
    try {
      await deleteStyle(s.id);
      setStyles((prev) => prev.filter((x) => x.id !== s.id));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  async function onToggleActive(s: WritingStyle) {
    try {
      const updated = await patchStyle(s.id, { is_active: !s.is_active });
      setStyles((prev) => prev.map((x) => (x.id === s.id ? updated : x)));
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Link
              href="/admin/content-creator"
              style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none' }}
            >
              ← Content Creator
            </Link>
          </div>
          <h1 className="swa-page-title">Writing Styles</h1>
          <p className="swa-page-subtitle">
            Reusable prompt fragments that steer the voice of every generated
            idea and draft. Pick one per brief — the edge functions prepend it
            to the system message. Retired styles stay in the table so
            historical drafts keep their audit trail.
          </p>
        </div>
        {formFor !== 'new' && (
          <button onClick={() => setFormFor('new')} className="swa-btn swa-btn--primary">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            New style
          </button>
        )}
      </div>

      {error && <div className="swa-alert swa-alert--error" style={{ marginBottom: 20 }}>{error}</div>}

      {formFor === 'new' && (
        <StyleForm
          title="New writing style"
          onCancel={() => setFormFor(null)}
          onSubmit={onCreate}
        />
      )}

      {loading && styles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>Loading…</div>
      ) : styles.length === 0 ? (
        <StylesEmptyState onCreate={() => setFormFor('new')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {styles.map((s) =>
            formFor === s.id ? (
              <StyleForm
                key={s.id}
                title="Edit writing style"
                initial={s}
                onCancel={() => setFormFor(null)}
                onSubmit={(v) => onUpdate(s.id, v)}
              />
            ) : (
              <StyleRow
                key={s.id}
                style={s}
                onEdit={()         => setFormFor(s.id)}
                onDelete={()       => onDelete(s)}
                onToggleActive={() => onToggleActive(s)}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
