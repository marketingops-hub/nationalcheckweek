"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * StyleForm — inline create/edit form for a writing style.
 *
 * Self-contained state: local `form` is seeded from `initial` when editing
 * and from defaults when creating. Submission delegates to `onSubmit`,
 * which is how the parent list decides whether this is a create vs. patch.
 *
 * We coerce empty `description` to `null` before submit so the DB gets a
 * tidy NULL rather than an empty string — matches the Zod schema's
 * nullable-string expectation.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import type {
  WritingStyle, CreateStyleInput, StyleAppliesTo, StyleExample,
} from "@/lib/content-creator/styles";
import { Field, inputStyle } from "./form-primitives";

/** Every non-wildcard applies_to value, in the order they appear in the UI. */
const SCOPE_OPTIONS: Exclude<StyleAppliesTo, 'all'>[] = ['blog', 'newsletter', 'social'];

export interface StyleFormProps {
  /** Header label — lets the parent show "New" vs "Edit". */
  title:     string;
  /** When present, the form is in edit mode — seeds state + changes the CTA. */
  initial?:  WritingStyle;
  onSubmit:  (input: CreateStyleInput) => Promise<void>;
  onCancel:  () => void;
}

export function StyleForm({ title, initial, onSubmit, onCancel }: StyleFormProps) {
  const [form, setForm] = useState<CreateStyleInput>({
    title:       initial?.title       ?? '',
    description: initial?.description ?? '',
    prompt:      initial?.prompt      ?? '',
    is_active:   initial?.is_active   ?? true,
    sort_order:  initial?.sort_order  ?? 0,
    // New in Apr-2026. Default ['all'] for new rows matches the DB default,
    // so the admin has to opt into scoping rather than out of it.
    applies_to:  (initial?.applies_to as StyleAppliesTo[] | undefined) ?? ['all'],
    examples:    initial?.examples    ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  /** applies_to: 'all' is mutually-exclusive with the individual types, so
   *  ticking one of blog/newsletter/social clears 'all', and ticking 'all'
   *  clears everything else. Mirrors the Zod normaliser. */
  function toggleScope(next: StyleAppliesTo) {
    setForm((f) => {
      const current = new Set((f.applies_to ?? ['all']) as StyleAppliesTo[]);
      if (next === 'all') {
        return { ...f, applies_to: ['all'] };
      }
      current.delete('all');
      if (current.has(next)) current.delete(next); else current.add(next);
      // Empty selection collapses back to 'all' — the DB CHECK requires ≥ 1.
      const arr = Array.from(current);
      return { ...f, applies_to: arr.length === 0 ? ['all'] : arr };
    });
  }

  /** examples: small CRUD over the local array. Cap at 3 to match Zod. */
  function addExample() {
    setForm((f) => {
      const next = [...(f.examples ?? []), { title: '', snippet: '' }];
      return { ...f, examples: next.slice(0, 3) };
    });
  }
  function updateExample(i: number, patch: Partial<StyleExample>) {
    setForm((f) => {
      const next = [...(f.examples ?? [])];
      next[i] = { ...next[i], ...patch };
      return { ...f, examples: next };
    });
  }
  function removeExample(i: number) {
    setForm((f) => ({ ...f, examples: (f.examples ?? []).filter((_, idx) => idx !== i) }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      // Scrub empty examples rows (admin opened one and walked away) so we
      // don't send an { title:'', snippet:'' } that would fail the
      // non-empty Zod check.
      const cleanedExamples = (form.examples ?? [])
        .map((ex) => ({
          title:   ex.title?.trim() || undefined,
          snippet: ex.snippet.trim(),
        }))
        .filter((ex) => ex.snippet.length > 0);

      await onSubmit({
        ...form,
        // Empty description → null for cleanliness in the DB.
        description: form.description?.trim() ? form.description.trim() : null,
        examples:    cleanedExamples,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      style={{
        background: '#fff', border: '2px solid #C4B5FD', borderRadius: 12,
        padding: 18, marginBottom: 16,
      }}
    >
      <h2 style={{
        fontSize: 14, fontWeight: 700, color: '#1E1040',
        margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
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
          style={{
            ...inputStyle,
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            fontSize: 13,
          }}
        />
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
          {form.prompt.length}/4000
        </div>
      </Field>

      {/* applies_to — scope this style to specific content types, or leave
          on 'all' to keep it universal. Rendered as chips so the mutually-
          exclusive-with-'all' rule is visually obvious. */}
      <Field
        label="Applies to"
        hint="Limit this style to specific content types. Uncheck everything to reset to universal."
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <ScopeChip
            active={(form.applies_to ?? []).includes('all')}
            label="All content types"
            onClick={() => toggleScope('all')}
          />
          {SCOPE_OPTIONS.map((t) => (
            <ScopeChip
              key={t}
              active={(form.applies_to ?? []).includes(t)}
              label={t.charAt(0).toUpperCase() + t.slice(1)}
              onClick={() => toggleScope(t)}
            />
          ))}
        </div>
      </Field>

      {/* examples — optional few-shot snippets. Same shape the edge fn
          renders into the STYLE EXAMPLES prompt block. */}
      <Field
        label="Style examples"
        hint="Up to 3 short snippets (≤500 chars each). Used as tonal anchors — the AI is told to match the cadence, not copy the wording."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(form.examples ?? []).map((ex, i) => (
            <div
              key={i}
              style={{
                border: '1px solid #E5E7EB', borderRadius: 8, padding: 10,
                background: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: 6,
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  value={ex.title ?? ''}
                  maxLength={80}
                  placeholder={`Example #${i + 1} label (optional)`}
                  onChange={(e) => updateExample(i, { title: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => removeExample(i)}
                  className="swa-btn"
                  style={{ fontSize: 12, padding: '6px 10px' }}
                  aria-label={`Remove example ${i + 1}`}
                >
                  Remove
                </button>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                value={ex.snippet}
                placeholder="The snippet text — one voice-true paragraph."
                onChange={(e) => updateExample(i, { snippet: e.target.value })}
                style={{
                  ...inputStyle,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  fontSize: 12,
                }}
              />
              <div style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'right' }}>
                {ex.snippet.length}/500
              </div>
            </div>
          ))}
          {(form.examples ?? []).length < 3 && (
            <button
              type="button"
              onClick={addExample}
              className="swa-btn"
              style={{ fontSize: 12, padding: '6px 10px', alignSelf: 'flex-start' }}
            >
              + Add example
            </button>
          )}
        </div>
      </Field>

      <label style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 13, marginBottom: 16,
      }}>
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

/** Toggle chip for the applies_to multi-select. Styled as a pill so the
 *  selected state is unambiguous on a dense form — a checkbox would get
 *  lost next to the existing "Active" toggle a few rows below. */
function ScopeChip({
  active, label, onClick,
}: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: '6px 12px',
        borderRadius: 999,
        border: `1px solid ${active ? '#5925F4' : '#D1D5DB'}`,
        background: active ? '#EDE9FE' : '#fff',
        color:      active ? '#4C1D95' : '#374151',
        fontSize: 12,
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        transition: 'background 120ms ease, color 120ms ease, border-color 120ms ease',
      }}
    >
      {label}
    </button>
  );
}
