"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/content-creator/styles
 *
 * CRUD for writing styles — reusable prompt fragments that steer the voice
 * of every generated idea and draft. The page has three zones:
 *
 *   1. A "New style" form that collapses when closed to keep the list
 *      scan-friendly. Title + description + prompt + active flag.
 *   2. A list of existing styles. Clicking "Edit" expands the same form
 *      inline so the admin never loses list context.
 *   3. Empty state with a one-click seed suggestion for first-time admins.
 *
 * No modals — keeps the keyboard-only flow fast and avoids a portal mount
 * for something this simple.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  listStyles,
  createStyle,
  patchStyle,
  deleteStyle,
  type WritingStyle,
  type CreateStyleInput,
} from "@/lib/content-creator/styles";

export default function StylesPage() {
  const [styles,  setStyles]  = useState<WritingStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // null = form closed. 'new' = create mode. string = edit mode for that id.
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
    if (!confirm(`Delete "${s.title}" permanently?\n\nDrafts already generated with this style keep working — they just lose the style metadata.`)) return;
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
            <Link href="/admin/content-creator" style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none' }}>
              ← Content Creator
            </Link>
          </div>
          <h1 className="swa-page-title">Writing Styles</h1>
          <p className="swa-page-subtitle">
            Reusable prompt fragments that steer the voice of every generated idea
            and draft. Pick one per brief — the edge functions prepend it to the
            system message. Retired styles stay in the table so historical drafts
            keep their audit trail.
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
        <EmptyState onCreate={() => setFormFor('new')} />
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
                onEdit={() => setFormFor(s.id)}
                onDelete={() => onDelete(s)}
                onToggleActive={() => onToggleActive(s)}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Sort helper ───────────────────────────────────────────────────────── */

function sortStyles(a: WritingStyle, b: WritingStyle) {
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
  return a.title.localeCompare(b.title);
}

/* ─── Row ────────────────────────────────────────────────────────────────── */

function StyleRow({
  style, onEdit, onDelete, onToggleActive,
}: {
  style: WritingStyle;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
      padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
      width: '100%', boxSizing: 'border-box',
    }}>
      <div style={{ flex: '1 1 0', minWidth: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 600, color: '#1E1040', fontSize: 15 }}>{style.title}</span>
          {!style.is_active && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
              background: '#F3F4F6', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              Retired
            </span>
          )}
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>#{style.sort_order}</span>
        </div>
        {style.description && (
          <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>
            {style.description}
          </div>
        )}
        <div style={{
          fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          <em>prompt:</em> {style.prompt.slice(0, 140)}{style.prompt.length > 140 ? '…' : ''}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
        <button
          onClick={onToggleActive}
          className="swa-btn"
          style={{ fontSize: 12, padding: '6px 10px', flexShrink: 0, whiteSpace: 'nowrap' }}
          title={style.is_active ? 'Hide from brief dropdown' : 'Make available to the brief dropdown'}
        >
          {style.is_active ? 'Retire' : 'Reactivate'}
        </button>
        <button onClick={onEdit} className="swa-icon-btn" title="Edit">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
        </button>
        <button onClick={onDelete} className="swa-icon-btn" title="Delete permanently" style={{ color: '#EF4444' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Inline create/edit form ────────────────────────────────────────────── */

function StyleForm({
  title, initial, onSubmit, onCancel,
}: {
  title: string;
  initial?: WritingStyle;
  onSubmit: (input: CreateStyleInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CreateStyleInput>({
    title:       initial?.title       ?? '',
    description: initial?.description ?? '',
    prompt:      initial?.prompt      ?? '',
    is_active:   initial?.is_active   ?? true,
    sort_order:  initial?.sort_order  ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await onSubmit({
        ...form,
        // Coerce empty description to null for cleanliness.
        description: form.description?.trim() ? form.description.trim() : null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} style={{
      background: '#fff', border: '2px solid #C4B5FD', borderRadius: 12,
      padding: 18, marginBottom: 16,
    }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1E1040', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {title}
      </h2>

      {error && <div className="swa-alert swa-alert--error" style={{ marginBottom: 12 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Field label="Title" hint="Short, unique. Shown in the brief dropdown.">
          <input
            required
            maxLength={120}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Storytelling"
            style={inputStyle}
          />
        </Field>
        <Field label="Sort order" hint="Lower numbers sort first.">
          <input
            type="number"
            min={0}
            max={10000}
            value={form.sort_order ?? 0}
            onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            style={inputStyle}
          />
        </Field>
      </div>

      <Field label="Description" hint="Free-text note for your team (not sent to the AI).">
        <input
          maxLength={400}
          value={form.description ?? ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="e.g. Narrative-led. Use for case studies, launch posts."
          style={inputStyle}
        />
      </Field>

      <Field
        label="Prompt"
        hint={`This text is prepended to the system message sent to OpenAI and Anthropic. Write in the second person — "You write in …".`}
      >
        <textarea
          required
          minLength={10}
          maxLength={4000}
          rows={8}
          value={form.prompt}
          onChange={(e) => setForm({ ...form, prompt: e.target.value })}
          placeholder={`You write in a story-telling voice. Open with a concrete scene…`}
          style={{ ...inputStyle, fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 13 }}
        />
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
          {form.prompt.length}/4000
        </div>
      </Field>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 16 }}>
        <input
          type="checkbox"
          checked={form.is_active ?? true}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
        />
        <span>Active — appears in the brief dropdown.</span>
      </label>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} className="swa-btn" disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="swa-btn swa-btn--primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create style'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      {children}
      {hint && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{hint}</div>}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid #D1D5DB', fontSize: 14, boxSizing: 'border-box',
};

/* ─── Empty state ────────────────────────────────────────────────────────── */

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>
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
