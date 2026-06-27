"use client";

/*
 * /admin/seo/optimize
 *
 * LLM Optimiser — pick any published page, generate vault-grounded patches
 * that fix its failing AISEO checks, review a before/after diff per patch,
 * accept/reject individual fixes, then write them back to the database.
 *
 * URL params: ?id=<uuid>&type=blog|event|page  (pre-selects a page)
 */

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { adminFetch } from '@/lib/adminFetch';
import type { PageReport, SeoCheck } from '@/lib/seo-analyzer';

/* ─── Types (mirror the route exports) ──────────────────────────────────── */

interface OptimizePatch {
  check_keys:  string[];
  field:       string;
  field_label: string;
  original:    string;
  optimized:   string;
  explanation: string;
}

interface OptimizeResult {
  page:            PageReport;
  patches:         OptimizePatch[];
  vault_refs:      Array<{ id: string; title: string; source: string }>;
  ai_score_before: number;
  ai_score_after:  number;
}

/* ─── Score helpers ──────────────────────────────────────────────────────── */

function scoreColor(s: number) {
  return s >= 75 ? '#16a34a' : s >= 50 ? '#d97706' : '#dc2626';
}
function scoreBg(s: number) {
  return s >= 75 ? '#f0fdf4' : s >= 50 ? '#fffbeb' : '#fef2f2';
}
function grade(s: number) {
  return s >= 90 ? 'A' : s >= 75 ? 'B' : s >= 55 ? 'C' : s >= 35 ? 'D' : 'F';
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const c = scoreColor(score);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: 60, height: 60, borderRadius: '50%',
        background: scoreBg(score), border: `3px solid ${c}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: c, lineHeight: 1 }}>{grade(score)}</span>
        <span style={{ fontSize: 10, color: c }}>{score}</span>
      </div>
      <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function CheckChip({ check }: { check: SeoCheck }) {
  const bg  = check.status === 'pass' ? '#f0fdf4' : check.status === 'warn' ? '#fffbeb' : '#fef2f2';
  const col = check.status === 'pass' ? '#16a34a' : check.status === 'warn' ? '#d97706'  : '#dc2626';
  const ico = check.status === 'pass' ? '✓'       : check.status === 'warn' ? '⚠'        : '✗';
  return (
    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: bg, color: col, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {ico} {check.label}
    </span>
  );
}

function typeTag(t: PageReport['type']) {
  const map = { blog: ['Blog', '#eff6ff', '#3b82f6'], event: ['Event', '#fdf4ff', '#13b5ea'], page: ['Page', '#f0fdf4', '#16a34a'] };
  const [l, bg, col] = map[t];
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: bg, color: col }}>{l}</span>;
}

/* ─── Page picker ────────────────────────────────────────────────────────── */

function PagePicker({ onSelect }: { onSelect: (p: PageReport) => void }) {
  const [pages,   setPages]   = useState<PageReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState<'all' | 'blog' | 'event' | 'page'>('all');
  const [sort,    setSort]    = useState<'aiScore' | 'title'>('aiScore');

  useEffect(() => {
    adminFetch('/api/admin/seo-report')
      .then(r => r.json())
      .then((d: { pages: PageReport[] }) => { setPages(d.pages ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    let list = filter === 'all' ? pages : pages.filter(p => p.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.slug.includes(q));
    }
    return [...list].sort((a, b) =>
      sort === 'title' ? a.title.localeCompare(b.title) : a.aiScore - b.aiScore,
    );
  }, [pages, filter, search, sort]);

  return (
    <div>
      <div style={{ marginBottom: 16, padding: '14px 18px', background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span className="material-symbols-outlined" style={{ color: '#3b82f6', fontSize: 20, marginTop: 1 }}>info</span>
        <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.5 }}>
          <strong>How it works:</strong> Select any published page. The AI analyses its failing LLM-readiness checks, pulls relevant facts from your Vault, and generates targeted rewrites. You review each fix before anything is saved.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Search pages…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, width: 220, background: 'var(--color-bg-input,#fff)' }}
        />
        <div style={{ display: 'flex', gap: 2, background: '#f3f4f6', padding: 3, borderRadius: 8 }}>
          {(['all','blog','event','page'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '4px 12px', fontSize: 12, borderRadius: 6, border: 'none', cursor: 'pointer',
              background: filter === f ? '#fff' : 'transparent',
              color:      filter === f ? 'var(--color-primary)' : '#6b7280',
              fontWeight: filter === f ? 700 : 500,
            }}>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}</button>
          ))}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value as 'aiScore' | 'title')} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, background: 'var(--color-bg-input,#fff)', marginLeft: 'auto' }}>
          <option value="aiScore">Sort: AISEO score ↑ (worst first)</option>
          <option value="title">Sort: Title A–Z</option>
        </select>
      </div>

      {loading && (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Loading pages…</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {visible.map(p => {
          const combined = Math.round((p.seoScore + p.aiScore) / 2);
          const failCount = [...p.aiChecks, ...p.seoChecks].filter(c => c.status !== 'pass').length;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              style={{
                width: '100%', textAlign: 'left', padding: '12px 16px',
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
                transition: 'border-color .15s, background .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#3b82f6'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff';    e.currentTarget.style.borderColor = '#e5e7eb'; }}
            >
              {/* Score ring */}
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: scoreBg(combined), border: `2px solid ${scoreColor(combined)}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: scoreColor(combined), lineHeight: 1 }}>{grade(combined)}</span>
                <span style={{ fontSize: 9, color: scoreColor(combined) }}>{combined}</span>
              </div>
              {/* Info */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#111', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {p.title}
                  {typeTag(p.type)}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>/{p.slug}</div>
              </div>
              {/* Scores */}
              <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: scoreColor(p.seoScore) }}>{p.seoScore}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>SEO</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: scoreColor(p.aiScore) }}>{p.aiScore}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>AISEO</div>
                </div>
              </div>
              {/* Issues */}
              <div style={{ flexShrink: 0, fontSize: 12, color: failCount > 0 ? '#dc2626' : '#16a34a', fontWeight: 600, minWidth: 80, textAlign: 'right' }}>
                {failCount > 0 ? `${failCount} issue${failCount > 1 ? 's' : ''}` : '✓ Optimised'}
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#9ca3af', flexShrink: 0 }}>chevron_right</span>
            </button>
          );
        })}
      </div>
      {!loading && visible.length === 0 && (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>No pages match your filter.</div>
      )}
    </div>
  );
}

/* ─── Patch card ─────────────────────────────────────────────────────────── */

function PatchCard({
  patch, accepted, onToggle,
}: {
  patch: OptimizePatch;
  accepted: boolean;
  onToggle: () => void;
}) {
  const [showFull, setShowFull] = useState(false);
  const PREVIEW = 300;
  const longContent = patch.optimized.length > PREVIEW || patch.original.length > PREVIEW;

  const CHECK_LABELS: Record<string, string> = {
    facts: 'Facts & stats', structure: 'Headings', depth: 'Content depth',
    entity: 'Org name', proper_nouns: 'Named entities', faq: 'FAQ section',
    sources: 'Source citations', title_specific: 'Specific title',
    meta_title: 'Meta title', meta_desc: 'Meta desc', excerpt: 'Excerpt',
    keyword_coherence: 'Keyword coherence',
  };

  return (
    <div style={{
      border: `2px solid ${accepted ? '#3b82f6' : '#e5e7eb'}`,
      borderRadius: 12, overflow: 'hidden',
      opacity: accepted ? 1 : 0.6,
      transition: 'border-color .15s, opacity .15s',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', background: accepted ? '#eff6ff' : '#f9fafb', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onToggle}
          style={{
            width: 22, height: 22, borderRadius: 6, border: `2px solid ${accepted ? '#3b82f6' : '#d1d5db'}`,
            background: accepted ? '#3b82f6' : '#fff', flexShrink: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {accepted && <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#fff' }}>check</span>}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>{patch.field_label}</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
            {patch.check_keys.map(k => (
              <span key={k} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: '#e0e7ff', color: '#0d8cb8', fontWeight: 600 }}>
                {CHECK_LABELS[k] ?? k}
              </span>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'right', maxWidth: 240 }}>
          {patch.explanation}
        </div>
      </div>

      {/* Diff */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {/* Before */}
        <div style={{ padding: '12px 14px', borderRight: '1px solid #e5e7eb', borderTop: '1px solid #e5e7eb', background: '#fff5f5' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#dc2626', marginBottom: 8 }}>Before</div>
          <pre style={{
            fontFamily: 'inherit', fontSize: 12, lineHeight: 1.6, color: '#374151',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
            maxHeight: showFull ? 'none' : 180, overflow: showFull ? 'visible' : 'hidden',
          }}>
            {patch.original || <em style={{ color: '#9ca3af' }}>(empty)</em>}
          </pre>
        </div>
        {/* After */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid #e5e7eb', background: '#f0fdf4' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#16a34a', marginBottom: 8 }}>After</div>
          <pre style={{
            fontFamily: 'inherit', fontSize: 12, lineHeight: 1.6, color: '#374151',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
            maxHeight: showFull ? 'none' : 180, overflow: showFull ? 'visible' : 'hidden',
          }}>
            {patch.optimized}
          </pre>
        </div>
      </div>

      {longContent && (
        <div style={{ borderTop: '1px solid #e5e7eb', padding: '8px 14px', background: '#f9fafb', textAlign: 'center' }}>
          <button onClick={() => setShowFull(v => !v)} style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            {showFull ? 'Show less ↑' : 'Show full content ↓'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Main optimise view ─────────────────────────────────────────────────── */

function OptimizeView({
  initial,
  onBack,
}: {
  initial: PageReport | null;
  onBack: () => void;
}) {
  const [selected,  setSelected]  = useState<PageReport | null>(initial);
  const [phase,     setPhase]     = useState<'idle' | 'optimizing' | 'review' | 'applying' | 'done'>('idle');
  const [result,    setResult]    = useState<OptimizeResult | null>(null);
  const [accepted,  setAccepted]  = useState<Set<string>>(new Set());
  const [error,     setError]     = useState('');
  const [applied,   setApplied]   = useState<string[]>([]);

  // Auto-run if a page was pre-selected via URL params
  useEffect(() => {
    if (initial && phase === 'idle') runOptimize(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runOptimize = useCallback(async (page: PageReport) => {
    setSelected(page);
    setPhase('optimizing');
    setError('');
    setResult(null);
    try {
      const res = await adminFetch('/api/admin/seo-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: page.id, type: page.type }),
        timeout: 110_000,
      });
      const data: OptimizeResult = await res.json();
      setResult(data);
      // Auto-accept all patches
      setAccepted(new Set(data.patches.map(p => p.field)));
      setPhase('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Optimisation failed');
      setPhase('idle');
    }
  }, []);

  const applyPatches = useCallback(async () => {
    if (!result || !selected) return;
    const toApply = result.patches.filter(p => accepted.has(p.field));
    if (!toApply.length) return;
    setPhase('applying');
    try {
      await adminFetch('/api/admin/seo-optimize', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, type: selected.type, patches: toApply }),
      });
      setApplied(toApply.map(p => p.field_label));
      setPhase('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Apply failed');
      setPhase('review');
    }
  }, [result, selected, accepted]);

  /* ── Picker state ── */
  if (!selected || phase === 'idle') {
    return (
      <div>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span> Back
        </button>
        {error && <div className="swa-alert swa-alert--error" style={{ marginBottom: 16 }}>{error}</div>}
        <PagePicker onSelect={p => runOptimize(p)} />
      </div>
    );
  }

  /* ── Optimizing spinner ── */
  if (phase === 'optimizing') {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🤖</div>
        <div style={{ fontWeight: 700, fontSize: 18, color: '#111', marginBottom: 8 }}>Optimising for AI search…</div>
        <div style={{ fontSize: 14, color: '#6b7280', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
          Analysing failing AISEO checks, searching the Vault for relevant facts, and generating targeted rewrites.
          <br /><span style={{ fontSize: 12, marginTop: 6, display: 'block' }}>This takes 15–45 seconds.</span>
        </div>
      </div>
    );
  }

  /* ── Done ── */
  if (phase === 'done') {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
        <div style={{ fontWeight: 700, fontSize: 20, color: '#111', marginBottom: 8 }}>Changes applied successfully</div>
        <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
          Updated: {applied.join(', ')}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {selected.editUrl && (
            <Link href={selected.editUrl} className="swa-btn swa-btn--primary" style={{ fontSize: 13 }}>
              ✏ Review in editor
            </Link>
          )}
          <a href={selected.url} target="_blank" rel="noopener noreferrer" className="swa-btn" style={{ fontSize: 13 }}>
            ↗ View live page
          </a>
          <Link href="/admin/seo/report" className="swa-btn" style={{ fontSize: 13 }}>
            📊 Re-run SEO Report
          </Link>
          <button className="swa-btn" style={{ fontSize: 13 }} onClick={() => { setPhase('idle'); setSelected(null); setResult(null); }}>
            ← Optimise another page
          </button>
        </div>
      </div>
    );
  }

  /* ── Review ── */
  if (!result) return null;

  const acceptedCount = accepted.size;
  const scoreGain     = result.ai_score_after - result.ai_score_before;

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24, padding: '16px 20px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {typeTag(selected.type)}
            <span style={{ fontWeight: 700, fontSize: 16, color: '#111' }}>{selected.title}</span>
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>/{selected.slug}</div>
          {/* Failing checks */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 10 }}>
            {[...selected.aiChecks, ...selected.seoChecks].filter(c => c.status !== 'pass').map(c => (
              <CheckChip key={c.key} check={c} />
            ))}
          </div>
        </div>
        {/* Score before/after */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <ScoreRing score={result.ai_score_before} label="AISEO now" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: scoreGain > 0 ? '#16a34a' : '#9ca3af' }}>arrow_forward</span>
            {scoreGain > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>+{scoreGain}</span>
            )}
          </div>
          <ScoreRing score={result.ai_score_after} label="After fixes" />
        </div>
      </div>

      {error && <div className="swa-alert swa-alert--error" style={{ marginBottom: 16 }}>{error}</div>}

      {result.patches.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#111', marginBottom: 6 }}>This page is already well-optimised for AI search!</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>No patches needed. Check the SEO Report for traditional SEO improvements.</div>
          <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link href="/admin/seo/report" className="swa-btn swa-btn--primary" style={{ fontSize: 13 }}>View SEO Report</Link>
            <button className="swa-btn" style={{ fontSize: 13 }} onClick={() => { setPhase('idle'); setSelected(null); }}>← Pick another page</button>
          </div>
        </div>
      ) : (
        <>
          {/* Vault refs */}
          {result.vault_refs.length > 0 && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#13b5ea', marginTop: 1 }}>lock</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#13b5ea', marginBottom: 4 }}>VAULT SOURCES USED</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {result.vault_refs.map(v => (
                    <span key={v.id} style={{ fontSize: 11, padding: '2px 8px', background: '#d6eef7', color: '#13b5ea', borderRadius: 10, fontWeight: 500 }}>{v.title || v.source || 'Vault document'}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Patch toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
              {acceptedCount} of {result.patches.length} patch{result.patches.length !== 1 ? 'es' : ''} selected
            </span>
            <button onClick={() => setAccepted(new Set(result.patches.map(p => p.field)))} style={{ fontSize: 12, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Select all
            </button>
            <button onClick={() => setAccepted(new Set())} style={{ fontSize: 12, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Deselect all
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="swa-btn" style={{ fontSize: 13 }} onClick={() => runOptimize(selected)}>
                ↻ Regenerate
              </button>
              <button
                className="swa-btn swa-btn--primary"
                style={{ fontSize: 13 }}
                disabled={acceptedCount === 0 || phase === 'applying'}
                onClick={applyPatches}
              >
                {phase === 'applying' ? 'Applying…' : acceptedCount > 0 ? `Apply ${acceptedCount} patch${acceptedCount !== 1 ? 'es' : ''} →` : 'Select patches above'}
              </button>
            </div>
          </div>

          {/* Patches */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {result.patches.map(p => (
              <PatchCard
                key={p.field}
                patch={p}
                accepted={accepted.has(p.field)}
                onToggle={() => setAccepted(prev => {
                  const next = new Set(prev);
                  next.has(p.field) ? next.delete(p.field) : next.add(p.field);
                  return next;
                })}
              />
            ))}
          </div>

          {/* Bottom apply bar */}
          <div style={{ marginTop: 20, padding: '14px 18px', background: '#f9fafb', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ flex: 1, fontSize: 13, color: '#374151' }}>
              {acceptedCount > 0
                ? `Ready to write ${acceptedCount} patch${acceptedCount !== 1 ? 'es' : ''} to the database. This will update the live page immediately.`
                : 'Select at least one patch above to apply changes.'}
            </div>
            <button
              className="swa-btn swa-btn--primary"
              style={{ fontSize: 13 }}
              disabled={acceptedCount === 0 || phase === 'applying'}
              onClick={applyPatches}
            >
              {phase === 'applying' ? 'Applying…' : `Apply ${acceptedCount > 0 ? acceptedCount : ''} patch${acceptedCount !== 1 ? 'es' : ''} →`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Suspense wrapper for useSearchParams ───────────────────────────────── */

function OptimizePageInner() {
  const params  = useSearchParams();
  const idParam = params.get('id');
  const tyParam = params.get('type');

  const [view, setView] = useState<'picker' | 'optimize'>(idParam ? 'optimize' : 'picker');
  const [pickerSeed, setPickerSeed] = useState<PageReport | null>(
    idParam && tyParam
      ? { id: idParam, type: tyParam as PageReport['type'], title: 'Loading…', slug: '', url: '', editUrl: '', seoScore: 0, aiScore: 0, seoChecks: [], aiChecks: [] }
      : null,
  );

  return (
    <div>
      {/* ── Header ── */}
      <div className="swa-page-header" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="swa-page-title">LLM Optimiser</h1>
          <p className="swa-page-subtitle">
            Select a published page. The AI fixes every failing AISEO check using your Vault as the source of truth.
            Review and accept individual patches before anything is saved.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/admin/seo/report" className="swa-btn" style={{ fontSize: 13 }}>
            📊 SEO Report
          </Link>
          <Link href="/admin/vault/sources" className="swa-btn" style={{ fontSize: 13 }}>
            🔒 Vault Library
          </Link>
        </div>
      </div>

      {/* ── How it works strip ── */}
      {view === 'picker' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 28 }}>
          {[
            { n: '1', icon: 'search', title: 'Pick a page', desc: 'Choose any published blog post, event, or CMS page' },
            { n: '2', icon: 'auto_awesome', title: 'AI analyses', desc: 'Claude identifies every failing LLM-readiness check' },
            { n: '3', icon: 'lock', title: 'Vault-grounded', desc: 'Rewrites use only facts from your Vault — no hallucination' },
            { n: '4', icon: 'edit', title: 'You decide', desc: 'Review each patch in a diff view, accept or reject individually' },
          ].map(s => (
            <div key={s.n} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#3b82f6' }}>{s.n}</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#111', marginBottom: 2 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'picker' ? (
        <PagePicker onSelect={p => { setPickerSeed(p); setView('optimize'); }} />
      ) : (
        <OptimizeView
          initial={pickerSeed}
          onBack={() => { setView('picker'); setPickerSeed(null); }}
        />
      )}
    </div>
  );
}

export default function OptimizePage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: '#9ca3af' }}>Loading…</div>}>
      <OptimizePageInner />
    </Suspense>
  );
}
