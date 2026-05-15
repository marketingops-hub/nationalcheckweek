"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * GenerateTopicsModal — form + backdrop for running `generateTopics`.
 *
 * Dialog pattern: click on backdrop closes the modal; clicks inside the
 * form stop-propagate so you don't accidentally dismiss while editing.
 * The modal mutates nothing on its own — all DB effects happen inside
 * `generateTopics` via the client, and the freshly-minted topics are
 * returned to the parent through `onGenerated`.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { generateTopics, type ContentTopic } from "@/lib/content-creator/topics";

export function GenerateTopicsModal({
  onClose, onGenerated,
}: {
  onClose:     () => void;
  onGenerated: (topics: ContentTopic[]) => void;
}) {
  const [category, setCategory] = useState('general');
  const [count,    setCount]    = useState(5);
  const [seed,     setSeed]     = useState('');
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const topics = await generateTopics({
        vault_category: category.trim() || 'all',
        count,
        seed: seed.trim() || undefined,
      });
      onGenerated(topics);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 20,
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        style={{
          background: '#fff', borderRadius: 12, padding: 24,
          maxWidth: 520, width: '100%',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1E1040' }}>
            Generate topics from vault
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
            The AI will read your vault documents (filtered by category) and
            propose content angles.
          </p>
        </div>

        <ModalField label="Category *">
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            placeholder="general, research, loneliness, events… or 'all'"
            style={modalInputStyle}
          />
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>
            Must match a Vault document category, or use <code>all</code> for
            cross-category.
          </span>
        </ModalField>

        <ModalField label="How many topics">
          <input
            type="number" min={1} max={10} value={count}
            onChange={(e) => setCount(parseInt(e.target.value, 10) || 5)}
            style={{ ...modalInputStyle, width: 120 }}
          />
        </ModalField>

        <ModalField label="Seed (optional)">
          <input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="e.g. angles for hospitality workers, or Gen Z loneliness"
            style={modalInputStyle}
          />
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>
            Leave blank for a diverse sample of the whole category.
          </span>
        </ModalField>

        {err && <div className="swa-alert swa-alert--error">{err}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="swa-btn" disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="swa-btn swa-btn--primary" disabled={busy}>
            {busy ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* Local primitives — kept private because nothing else in the topics
 * area needs this particular label layout. */

const modalInputStyle: React.CSSProperties = {
  padding: '9px 12px', border: '1px solid #E5E7EB',
  borderRadius: 8, fontSize: 14,
};

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{
        fontSize: 11, fontWeight: 700, color: '#374151',
        textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
        {label}
      </span>
      {children}
    </label>
  );
}
