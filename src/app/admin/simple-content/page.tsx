"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/simple-content — Simplified Content Creator
 *
 * Three-step flow, all on one page:
 *
 *   Step 1 — Prompt
 *     Admin types a prompt or idea. Clicking "Suggest titles" hits the
 *     edge fn and renders 4 title options.
 *
 *   Step 2 — Pick title
 *     Admin clicks a title (or edits it). Clicking "Generate" produces the
 *     full blog post grounded in the Vault.
 *
 *   Step 3 — Review
 *     Admin reads the generated post. "Approve & save as draft" publishes it
 *     to blog_posts (unpublished). "Start over" clears everything.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useRef } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/adminFetch';

/* ─── Types ─────────────────────────────────────────────────────────────── */

type Step = 'prompt' | 'titles' | 'generating' | 'review' | 'done';

interface GeneratedContent {
  title: string;
  body:  string;
}

/* ─── API helpers ────────────────────────────────────────────────────────── */

async function suggestTitles(prompt: string): Promise<string[]> {
  const res = await adminFetch('/api/admin/simple-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'suggest_titles', prompt }),
  });
  const data = await res.json() as { titles?: string[]; error?: string };
  if (!res.ok || !data.titles) throw new Error(data.error ?? 'No titles returned.');
  return data.titles;
}

async function generateContent(prompt: string, title: string): Promise<GeneratedContent> {
  const res = await adminFetch('/api/admin/simple-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'generate', prompt, title }),
  });
  const data = await res.json() as { title?: string; body?: string; error?: string };
  if (!res.ok || !data.body) throw new Error(data.error ?? 'No content returned.');
  return { title: data.title ?? title, body: data.body };
}

async function publishContent(title: string, body: string): Promise<void> {
  const res = await adminFetch('/api/admin/simple-content/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function SimpleContentPage() {
  const [step,    setStep]    = useState<Step>('prompt');
  const [prompt,  setPrompt]  = useState('');
  const [titles,  setTitles]  = useState<string[]>([]);
  const [picked,  setPicked]  = useState('');
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  function reset() {
    setStep('prompt'); setPrompt(''); setTitles([]);
    setPicked(''); setContent(null); setError(''); setLoading(false);
    setTimeout(() => promptRef.current?.focus(), 50);
  }

  async function handleSuggestTitles() {
    if (!prompt.trim()) return;
    setError(''); setLoading(true);
    try {
      const t = await suggestTitles(prompt.trim());
      setTitles(t);
      setPicked(t[0] ?? '');
      setStep('titles');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!picked.trim()) return;
    setError(''); setLoading(true); setStep('generating');
    try {
      const c = await generateContent(prompt.trim(), picked.trim());
      setContent(c);
      setStep('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setStep('titles');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!content) return;
    setError(''); setLoading(true);
    try {
      await publishContent(content.title, content.body);
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save draft.');
    } finally {
      setLoading(false);
    }
  }

  /* ── Render ─────────────────────────────────────────────────────────── */

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'var(--admin-accent)' }}>bolt</span>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--admin-text)' }}>
            Quick Content
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-text-muted)' }}>
          Type an idea, pick a title, review the Vault-grounded draft, then save it to the blog.
        </p>
      </div>

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
      {(step === 'prompt') && (
        <div style={{ marginTop: 24 }}>
          <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 8, color: 'var(--admin-text)' }}>
            What do you want to write about?
          </label>
          <textarea
            ref={promptRef}
            autoFocus
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSuggestTitles(); }}
            placeholder="e.g. anxiety rates among teenagers in regional Australia, and what schools can do…"
            rows={4}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '12px 14px',
              borderRadius: 8, border: '1px solid var(--admin-border)',
              background: 'var(--admin-input-bg, var(--admin-surface))',
              color: 'var(--admin-text)', fontSize: 14, resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--admin-text-muted)' }}>
            Be specific — the more context, the better the Vault match.
          </div>
          <button
            onClick={handleSuggestTitles}
            disabled={loading || !prompt.trim()}
            style={primaryBtn}
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
            {titles.map((t) => (
              <button
                key={t}
                onClick={() => setPicked(t)}
                style={{
                  textAlign: 'left', padding: '12px 16px', borderRadius: 8,
                  border: `2px solid ${picked === t ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                  background: picked === t ? 'var(--admin-accent-bg, #eff6ff)' : 'var(--admin-surface)',
                  color: 'var(--admin-text)', fontSize: 14, fontWeight: picked === t ? 600 : 400,
                  cursor: 'pointer', transition: 'border-color .15s, background .15s',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <label style={{ display: 'block', fontWeight: 600, fontSize: 12, marginBottom: 6, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Or edit the title
          </label>
          <input
            type="text"
            value={picked}
            onChange={e => setPicked(e.target.value)}
            placeholder="Custom title…"
            style={{
              width: '100%', boxSizing: 'border-box', padding: '10px 14px',
              borderRadius: 8, border: '1px solid var(--admin-border)',
              background: 'var(--admin-input-bg, var(--admin-surface))',
              color: 'var(--admin-text)', fontSize: 14, fontFamily: 'inherit',
            }}
          />

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={reset} style={ghostBtn}>← Start over</button>
            <button onClick={handleGenerate} disabled={loading || !picked.trim()} style={primaryBtn}>
              {loading ? <Spinner /> : <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_awesome</span> Generate</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Generating spinner ─────────────────────────────────── */}
      {step === 'generating' && (
        <div style={{ marginTop: 48, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 14 }}>
          <div style={{ marginBottom: 16 }}>
            <Spinner size={28} />
          </div>
          <p style={{ margin: 0, fontWeight: 600 }}>Writing your post…</p>
          <p style={{ margin: '6px 0 0', fontSize: 12 }}>Fetching Vault context and generating content. This usually takes 20–40 seconds.</p>
        </div>
      )}

      {/* ── Step 3: Review ─────────────────────────────────────── */}
      {step === 'review' && content && (
        <div style={{ marginTop: 24 }}>
          <div style={{
            padding: '20px 24px', borderRadius: 10,
            border: '1px solid var(--admin-border)',
            background: 'var(--admin-surface)',
          }}>
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
          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            <button onClick={reset} style={ghostBtn}>✕ Discard</button>
            <button
              onClick={() => { setStep('titles'); }}
              style={ghostBtn}
            >
              ← Back to titles
            </button>
            <button onClick={handleApprove} disabled={loading} style={primaryBtn}>
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
          background: 'var(--admin-success-bg, #f0fdf4)',
          textAlign: 'center',
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
            <Link href="/admin/blog" style={primaryBtn as React.CSSProperties}>
              Go to Blog →
            </Link>
            <button onClick={reset} style={ghostBtn}>Create another</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Step breadcrumb ────────────────────────────────────────────────────── */

const STEPS: { key: Step | string; label: string }[] = [
  { key: 'prompt',     label: '1. Prompt'  },
  { key: 'titles',     label: '2. Title'   },
  { key: 'review',     label: '3. Review'  },
  { key: 'done',       label: '4. Done'    },
];

function StepBreadcrumb({ step }: { step: Step }) {
  const active = step === 'generating' ? 'titles' : step;
  const idx = STEPS.findIndex(s => s.key === active);
  return (
    <div style={{ display: 'flex', gap: 0, alignItems: 'center', marginBottom: 4 }}>
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

/* ─── Shared button styles ───────────────────────────────────────────────── */

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

/* ─── Spinner ────────────────────────────────────────────────────────────── */

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      border: `2px solid currentColor`, borderTopColor: 'transparent',
      borderRadius: '50%', animation: 'spin .7s linear infinite',
    }} />
  );
}
