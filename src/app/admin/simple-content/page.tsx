"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/simple-content — Simplified Content Creator
 *
 * Flow:
 *   1. Prompt  → suggest 4 Vault-grounded title options
 *   2. Title   → generate full blog post (with optional feedback on re-runs)
 *   3. Review  → read content, see vault references, give feedback to regenerate
 *   4. Done    → saved as unpublished blog draft
 *
 * Left panel: history of the last 20 generations with publish status.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/adminFetch';
import type { VaultRef } from '@/app/api/admin/simple-content/route';
import type { HistoryEntry } from '@/app/api/admin/simple-content/history/route';

/* ─── Types ─────────────────────────────────────────────────────────────── */

type Step = 'prompt' | 'titles' | 'generating' | 'review' | 'done';

interface GeneratedContent {
  title:      string;
  body:       string;
  history_id: string | null;
  vault_refs: VaultRef[];
}

/* ─── API helpers ────────────────────────────────────────────────────────── */

async function apiSuggestTitles(prompt: string): Promise<string[]> {
  const res  = await adminFetch('/api/admin/simple-content', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ action: 'suggest_titles', prompt }),
  });
  const data = await res.json() as { titles?: string[]; error?: string };
  if (!res.ok || !data.titles) throw new Error(data.error ?? 'No titles returned.');
  return data.titles;
}

async function apiGenerate(
  prompt: string,
  title: string,
  feedback: string | null,
  historyId: string | null,
): Promise<GeneratedContent> {
  const res  = await adminFetch('/api/admin/simple-content', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ action: 'generate', prompt, title, feedback, history_id: historyId }),
  });
  const data = await res.json() as { title?: string; body?: string; history_id?: string; vault_refs?: VaultRef[]; error?: string };
  if (!res.ok || !data.body) throw new Error(data.error ?? 'No content returned.');
  return {
    title:      data.title      ?? title,
    body:       data.body,
    history_id: data.history_id ?? null,
    vault_refs: data.vault_refs ?? [],
  };
}

async function apiPublish(title: string, body: string, historyId: string | null): Promise<void> {
  const res = await adminFetch('/api/admin/simple-content/publish', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ title, body, history_id: historyId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
}

async function apiHistory(): Promise<HistoryEntry[]> {
  const res  = await adminFetch('/api/admin/simple-content/history');
  const data = await res.json() as { history?: HistoryEntry[]; error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Failed to load history.');
  return data.history ?? [];
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export default function SimpleContentPage() {
  const [step,      setStep]      = useState<Step>('prompt');
  const [prompt,    setPrompt]    = useState('');
  const [titles,    setTitles]    = useState<string[]>([]);
  const [picked,    setPicked]    = useState('');
  const [content,   setContent]   = useState<GeneratedContent | null>(null);
  const [feedback,  setFeedback]  = useState('');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [history,   setHistory]   = useState<HistoryEntry[]>([]);
  const [histPanel, setHistPanel] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Load history on mount
  const refreshHistory = useCallback(async () => {
    try { setHistory(await apiHistory()); } catch { /* non-fatal */ }
  }, []);

  useEffect(() => { refreshHistory(); }, [refreshHistory]);

  function reset() {
    setStep('prompt'); setPrompt(''); setTitles([]);
    setPicked(''); setContent(null); setFeedback(''); setError(''); setLoading(false);
    setTimeout(() => promptRef.current?.focus(), 50);
  }

  // Restore a history entry into review step
  function restoreHistory(entry: HistoryEntry) {
    setPrompt(entry.prompt);
    setPicked(entry.title);
    setContent({ title: entry.title, body: entry.body, history_id: entry.id, vault_refs: [] });
    setFeedback('');
    setError('');
    setStep('review');
    setHistPanel(false);
  }

  async function handleSuggestTitles() {
    if (!prompt.trim()) return;
    setError(''); setLoading(true);
    try {
      const t = await apiSuggestTitles(prompt.trim());
      setTitles(t); setPicked(t[0] ?? ''); setStep('titles');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally { setLoading(false); }
  }

  async function handleGenerate(fb: string | null = null) {
    if (!picked.trim()) return;
    setError(''); setLoading(true); setStep('generating');
    try {
      const c = await apiGenerate(
        prompt.trim(),
        picked.trim(),
        fb,
        content?.history_id ?? null,
      );
      setContent(c);
      setFeedback('');
      setStep('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setStep(fb ? 'review' : 'titles');
      if (fb) setContent(content); // keep previous content visible on feedback re-gen failure
    } finally { setLoading(false); }
  }

  async function handleApprove() {
    if (!content) return;
    setError(''); setLoading(true);
    try {
      await apiPublish(content.title, content.body, content.history_id);
      await refreshHistory();
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save draft.');
    } finally { setLoading(false); }
  }

  /* ── Render ─────────────────────────────────────────────────────────── */

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px', position: 'relative' }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--admin-accent)' }}>bolt</span>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--admin-text)' }}>Quick Content</h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-text-muted)' }}>
            Type an idea → pick a title → review the Vault-grounded draft → save to blog.
          </p>
        </div>
        <button
          onClick={() => setHistPanel(v => !v)}
          style={{ ...ghostBtn, gap: 6, whiteSpace: 'nowrap' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>history</span>
          History {history.length > 0 && `(${history.length})`}
        </button>
      </div>

      {/* History slide-in panel */}
      {histPanel && (
        <HistoryPanel history={history} onRestore={restoreHistory} onClose={() => setHistPanel(false)} />
      )}

      {/* Progress breadcrumb */}
      <StepBreadcrumb step={step} />

      {/* Error banner */}
      {error && (
        <div style={{
          margin: '16px 0', padding: '12px 16px', borderRadius: 8,
          background: 'var(--admin-danger-bg, #fef2f2)',
          border: '1px solid var(--admin-danger-border, #fecaca)',
          color: 'var(--admin-danger, #dc2626)', fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* ── Step 1: Prompt ─────────────────────────────────────── */}
      {step === 'prompt' && (
        <div style={{ marginTop: 24 }}>
          <label style={labelStyle}>What do you want to write about?</label>
          <textarea
            ref={promptRef}
            autoFocus
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSuggestTitles(); }}
            placeholder="e.g. anxiety rates among teenagers in regional Australia, and what schools can do…"
            rows={4}
            style={textareaStyle}
          />
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--admin-text-muted)' }}>
            Be specific — the more context, the better the Vault match. ⌘+Enter to continue.
          </div>
          <button
            onClick={handleSuggestTitles}
            disabled={loading || !prompt.trim()}
            style={btnStyle(primaryBtn, loading || !prompt.trim())}
          >
            {loading ? <Spinner /> : <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>lightbulb</span> Suggest titles</>}
          </button>
        </div>
      )}

      {/* ── Step 2: Pick title ─────────────────────────────────── */}
      {step === 'titles' && (
        <div style={{ marginTop: 24 }}>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--admin-text-muted)' }}>
            Pick a title below, or edit it to your liking.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {titles.map(t => (
              <button key={t} onClick={() => setPicked(t)} style={{
                textAlign: 'left', padding: '12px 16px', borderRadius: 8,
                border: `2px solid ${picked === t ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                background: picked === t ? 'var(--admin-accent-bg, #eff6ff)' : 'var(--admin-surface)',
                color: 'var(--admin-text)', fontSize: 14, fontWeight: picked === t ? 600 : 400,
                cursor: 'pointer', transition: 'border-color .15s, background .15s',
              }}>
                {t}
              </button>
            ))}
          </div>
          <label style={{ ...labelStyle, fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'var(--admin-text-muted)' }}>
            Or edit the title
          </label>
          <input
            type="text"
            value={picked}
            onChange={e => setPicked(e.target.value)}
            placeholder="Custom title…"
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={reset} style={ghostBtn}>← Start over</button>
            <button onClick={() => handleGenerate(null)} disabled={loading || !picked.trim()} style={btnStyle(primaryBtn, loading || !picked.trim())}>
              {loading ? <Spinner /> : <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_awesome</span> Generate</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Generating spinner ─────────────────────────────────── */}
      {step === 'generating' && (
        <div style={{ marginTop: 48, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 14 }}>
          <div style={{ marginBottom: 16 }}><Spinner size={28} /></div>
          <p style={{ margin: 0, fontWeight: 600 }}>Writing your post…</p>
          <p style={{ margin: '6px 0 0', fontSize: 12 }}>
            Fetching Vault context and generating content. This usually takes 20–40 seconds.
          </p>
        </div>
      )}

      {/* ── Step 3: Review ─────────────────────────────────────── */}
      {step === 'review' && content && (
        <div style={{ marginTop: 24 }}>
          {/* Content card */}
          <div style={{ padding: '20px 24px', borderRadius: 10, border: '1px solid var(--admin-border)', background: 'var(--admin-surface)' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: 'var(--admin-text)', lineHeight: 1.3 }}>
              {content.title}
            </h2>
            <div style={{
              whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7,
              color: 'var(--admin-text)', maxHeight: 480, overflowY: 'auto',
              borderTop: '1px solid var(--admin-border)', paddingTop: 16,
            }}>
              {content.body}
            </div>
          </div>

          {/* Vault references */}
          {content.vault_refs.length > 0 && (
            <VaultReferences refs={content.vault_refs} />
          )}

          {/* Feedback form */}
          <FeedbackForm
            feedback={feedback}
            onChange={setFeedback}
            onRegenerate={() => handleGenerate(feedback.trim() || null)}
            loading={loading}
          />

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            <button onClick={reset} style={ghostBtn}>✕ Discard</button>
            <button onClick={() => { setContent(null); setStep('titles'); }} style={ghostBtn}>← Back to titles</button>
            <button onClick={handleApprove} disabled={loading} style={btnStyle(primaryBtn, loading)}>
              {loading ? <Spinner /> : <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span> Approve &amp; save as blog draft</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Done ───────────────────────────────────────────────── */}
      {step === 'done' && (
        <div style={{
          marginTop: 32, padding: '24px 28px', borderRadius: 10,
          border: '1px solid var(--admin-success-border, #bbf7d0)',
          background: 'var(--admin-success-bg, #f0fdf4)', textAlign: 'center',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--admin-success, #16a34a)', display: 'block', marginBottom: 10 }}>
            check_circle
          </span>
          <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 16, color: 'var(--admin-text)' }}>
            Saved as blog draft
          </p>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--admin-text-muted)' }}>
            Your post is in the blog as an unpublished draft. Head to Blog to review and publish it.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/admin/blog" style={primaryBtn as React.CSSProperties}>Go to Blog →</Link>
            <button onClick={reset} style={ghostBtn}>Create another</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── History panel ──────────────────────────────────────────────────────── */

function HistoryPanel({
  history, onRestore, onClose,
}: { history: HistoryEntry[]; onRestore: (e: HistoryEntry) => void; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 360,
      background: 'var(--admin-surface)', borderLeft: '1px solid var(--admin-border)',
      boxShadow: '-4px 0 20px rgba(0,0,0,.08)', zIndex: 100,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--admin-border)' }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--admin-text)' }}>Recent generations</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)', fontSize: 20, lineHeight: 1 }}>✕</button>
      </div>

      {history.length === 0 ? (
        <p style={{ padding: '24px 20px', fontSize: 13, color: 'var(--admin-text-muted)', textAlign: 'center' }}>
          No generations yet. Create your first post above.
        </p>
      ) : (
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {history.map(entry => (
            <div key={entry.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--admin-border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text)', lineHeight: 1.3, flex: 1 }}>
                  {entry.title}
                </span>
                {entry.published_post_id && (
                  <span style={{ fontSize: 11, background: 'var(--admin-success-bg, #f0fdf4)', color: 'var(--admin-success, #16a34a)', border: '1px solid var(--admin-success-border, #bbf7d0)', borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap' }}>
                    Published
                  </span>
                )}
              </div>
              <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--admin-text-muted)' }}>
                {new Date(entry.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--admin-text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                {entry.prompt}
              </p>
              <button
                onClick={() => onRestore(entry)}
                style={{ fontSize: 12, color: 'var(--admin-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
              >
                Restore →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Vault references ───────────────────────────────────────────────────── */

function VaultReferences({ refs }: { refs: VaultRef[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 14, borderRadius: 8, border: '1px solid var(--admin-border)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', textAlign: 'left', padding: '10px 16px',
          background: 'var(--admin-surface)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, fontWeight: 600, color: 'var(--admin-text)',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--admin-accent)' }}>verified</span>
        {refs.length} Vault {refs.length === 1 ? 'reference' : 'references'} used
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--admin-text-muted)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '4px 0', borderTop: '1px solid var(--admin-border)', background: 'var(--admin-bg, #fafafa)' }}>
          {refs.map(r => (
            <div key={r.id} style={{ padding: '8px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--admin-text-muted)', marginTop: 2, flexShrink: 0 }}>article</span>
              <div>
                <div style={{ fontSize: 13, color: 'var(--admin-text)', fontWeight: 500 }}>{r.title}</div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>{r.source}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Feedback form ──────────────────────────────────────────────────────── */

function FeedbackForm({
  feedback, onChange, onRegenerate, loading,
}: { feedback: string; onChange: (v: string) => void; onRegenerate: () => void; loading: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 14, borderRadius: 8, border: '1px solid var(--admin-border)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', textAlign: 'left', padding: '10px 16px',
          background: 'var(--admin-surface)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 13, fontWeight: 600, color: 'var(--admin-text)',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--admin-text-muted)' }}>edit_note</span>
        Not quite right? Give feedback to regenerate
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--admin-text-muted)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--admin-border)', background: 'var(--admin-bg, #fafafa)' }}>
          <label style={{ ...labelStyle, fontSize: 12, marginBottom: 6 }}>
            What should be different in the next version?
          </label>
          <textarea
            autoFocus
            value={feedback}
            onChange={e => onChange(e.target.value)}
            placeholder="e.g. Make it shorter, focus more on primary schools, add a stronger call to action…"
            rows={3}
            maxLength={1000}
            style={{ ...textareaStyle, marginBottom: 0 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{feedback.length}/1000</span>
            <button
              onClick={onRegenerate}
              disabled={loading || !feedback.trim()}
              style={btnStyle(primaryBtn, loading || !feedback.trim())}
            >
              {loading ? <Spinner /> : <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span> Regenerate with feedback</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Step breadcrumb ────────────────────────────────────────────────────── */

const STEPS: { key: Step | string; label: string }[] = [
  { key: 'prompt',  label: '1. Prompt' },
  { key: 'titles',  label: '2. Title'  },
  { key: 'review',  label: '3. Review' },
  { key: 'done',    label: '4. Done'   },
];

function StepBreadcrumb({ step }: { step: Step }) {
  const active = step === 'generating' ? 'titles' : step;
  const idx = STEPS.findIndex(s => s.key === active);
  return (
    <div style={{ display: 'flex', gap: 0, alignItems: 'center', marginBottom: 16 }}>
      {STEPS.map((s, i) => (
        <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
          {i > 0 && <span style={{ color: 'var(--admin-border)', margin: '0 6px', fontSize: 12 }}>›</span>}
          <span style={{
            fontSize: 12, fontWeight: i === idx ? 600 : 400,
            color: i < idx ? 'var(--admin-success, #16a34a)' : i === idx ? 'var(--admin-accent)' : 'var(--admin-text-muted)',
          }}>
            {i < idx && '✓ '}{s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Shared styles ──────────────────────────────────────────────────────── */

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '10px 20px', borderRadius: 8, border: 'none',
  background: 'var(--admin-accent, #3b82f6)', color: '#fff',
  fontWeight: 600, fontSize: 14, cursor: 'pointer',
  opacity: 1, transition: 'opacity .15s',
};

const ghostBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '10px 16px', borderRadius: 8,
  border: '1px solid var(--admin-border)',
  background: 'transparent', color: 'var(--admin-text-muted)',
  fontWeight: 500, fontSize: 14, cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontWeight: 600, fontSize: 13,
  marginBottom: 8, color: 'var(--admin-text)',
};

const textareaStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '12px 14px',
  borderRadius: 8, border: '1px solid var(--admin-border)',
  background: 'var(--admin-input-bg, var(--admin-surface))',
  color: 'var(--admin-text)', fontSize: 14, resize: 'vertical',
  fontFamily: 'inherit',
};

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 14px',
  borderRadius: 8, border: '1px solid var(--admin-border)',
  background: 'var(--admin-input-bg, var(--admin-surface))',
  color: 'var(--admin-text)', fontSize: 14, fontFamily: 'inherit',
};

function btnStyle(base: React.CSSProperties, disabled: boolean): React.CSSProperties {
  return { ...base, opacity: disabled ? 0.55 : 1, cursor: disabled ? 'not-allowed' : 'pointer' };
}

/* ─── Spinner ────────────────────────────────────────────────────────────── */

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      border: '2px solid currentColor', borderTopColor: 'transparent',
      borderRadius: '50%', animation: 'spin .7s linear infinite',
    }} />
  );
}
