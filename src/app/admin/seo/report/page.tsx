"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/seo/report — SEO + AISEO audit for every published page
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/adminFetch';
import type { PageReport, SeoCheck, CheckStatus } from '@/lib/seo-analyzer';

type FilterType = 'all' | 'blog' | 'event' | 'page' | 'critical';
type SortKey    = 'seoScore' | 'aiScore' | 'title' | 'combined';

/* ─── Score helpers ──────────────────────────────────────────────────────── */

function scoreColor(s: number): string {
  if (s >= 75) return '#16a34a';
  if (s >= 50) return '#d97706';
  return '#dc2626';
}

function scoreBg(s: number): string {
  if (s >= 75) return '#f0fdf4';
  if (s >= 50) return '#fffbeb';
  return '#fef2f2';
}

function grade(s: number): string {
  if (s >= 90) return 'A';
  if (s >= 75) return 'B';
  if (s >= 55) return 'C';
  if (s >= 35) return 'D';
  return 'F';
}

function statusIcon(s: CheckStatus) {
  if (s === 'pass') return <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span>;
  if (s === 'warn') return <span style={{ color: '#d97706', fontWeight: 700 }}>⚠</span>;
  return <span style={{ color: '#dc2626', fontWeight: 700 }}>✗</span>;
}

function typeLabel(t: PageReport['type']) {
  const map = { blog: 'Blog', event: 'Event', page: 'Page' };
  const bg  = { blog: '#eff6ff', event: '#fdf4ff', page: '#f0fdf4' };
  const col = { blog: '#3b82f6', event: '#9333ea', page: '#16a34a' };
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: bg[t], color: col[t] }}>
      {map[t]}
    </span>
  );
}

/* ─── Top issues — sorted by most points missed ──────────────────────────── */

function topIssues(checks: SeoCheck[], n = 2): SeoCheck[] {
  return checks
    .filter(c => c.status !== 'pass')
    .sort((a, b) => (b.max - b.points) - (a.max - a.points))
    .slice(0, n);
}

/* ─── Score badge ────────────────────────────────────────────────────────── */

function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 36 : 44;
  const fs  = size === 'sm' ? 13 : 15;
  return (
    <div style={{
      width: dim, height: dim, borderRadius: '50%',
      background: scoreBg(score), border: `2px solid ${scoreColor(score)}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', flexShrink: 0,
    }}>
      <span style={{ fontSize: fs, fontWeight: 800, color: scoreColor(score), lineHeight: 1 }}>{grade(score)}</span>
      <span style={{ fontSize: 9, color: scoreColor(score), lineHeight: 1, marginTop: 1 }}>{score}</span>
    </div>
  );
}

/* ─── Inline score bar ───────────────────────────────────────────────────── */

function ScoreBar({ score }: { score: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <span style={{ fontSize: 14, fontWeight: 800, color: scoreColor(score) }}>{score}</span>
      <div style={{ width: 52, height: 5, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: scoreColor(score), borderRadius: 3, transition: 'width .3s' }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color: scoreColor(score) }}>{grade(score)}</span>
    </div>
  );
}

/* ─── Checks breakdown panel ─────────────────────────────────────────────── */

function ChecksTable({ checks, title }: { checks: SeoCheck[]; title: string }) {
  // Sort: fails first, then warns, then passes — within each group by points missed desc
  const sorted = [...checks].sort((a, b) => {
    const order = { fail: 0, warn: 1, pass: 2 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return (b.max - b.points) - (a.max - a.points);
  });

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted, #6b7280)', marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sorted.map(c => (
          <div key={c.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 6, background: c.status === 'pass' ? '#f0fdf4' : c.status === 'warn' ? '#fffbeb' : '#fef2f2' }}>
            <span style={{ marginTop: 1, flexShrink: 0 }}>{statusIcon(c.status)}</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary, #111)' }}>{c.label}</span>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted, #6b7280)', marginLeft: 6 }}>{c.message}</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: scoreColor(Math.round(c.max > 0 ? (c.points / c.max) * 100 : 0)), flexShrink: 0 }}>
              {c.points}/{c.max}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── CSV export ─────────────────────────────────────────────────────────── */

function exportCsv(pages: PageReport[]) {
  const header = ['Title', 'Type', 'Slug', 'URL', 'SEO Score', 'SEO Grade', 'AISEO Score', 'AISEO Grade', 'Combined', 'Edit URL'];
  const rows = pages.map(p => [
    `"${p.title.replace(/"/g, '""')}"`,
    p.type,
    p.slug,
    p.url,
    p.seoScore,
    grade(p.seoScore),
    p.aiScore,
    grade(p.aiScore),
    Math.round((p.seoScore + p.aiScore) / 2),
    p.editUrl,
  ]);
  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `seo-report-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export default function SeoReportPage() {
  const [pages,     setPages]     = useState<PageReport[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [genAt,     setGenAt]     = useState('');
  const [filter,    setFilter]    = useState<FilterType>('all');
  const [sort,      setSort]      = useState<SortKey>('combined');
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [search,    setSearch]    = useState('');

  const loadReport = useCallback(() => {
    setLoading(true);
    setError('');
    adminFetch('/api/admin/seo-report')
      .then(r => r.json())
      .then((d: { pages: PageReport[]; generated_at: string }) => {
        setPages(d.pages ?? []);
        setGenAt(d.generated_at);
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  useEffect(() => { loadReport(); }, [loadReport]);

  const filtered = useMemo(() => {
    let list = pages;
    if (filter === 'critical') {
      list = pages.filter(p => p.seoScore < 40 || p.aiScore < 40);
    } else if (filter !== 'all') {
      list = pages.filter(p => p.type === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.slug.includes(q));
    }
    return [...list].sort((a, b) => {
      if (sort === 'title')    return a.title.localeCompare(b.title);
      if (sort === 'seoScore') return b.seoScore - a.seoScore;
      if (sort === 'aiScore')  return b.aiScore  - a.aiScore;
      return ((b.seoScore + b.aiScore) / 2) - ((a.seoScore + a.aiScore) / 2);
    });
  }, [pages, filter, sort, search]);

  const stats = useMemo(() => {
    const src = pages;
    if (!src.length) return null;
    const avgSeo  = Math.round(src.reduce((s, p) => s + p.seoScore, 0) / src.length);
    const avgAi   = Math.round(src.reduce((s, p) => s + p.aiScore,  0) / src.length);
    const critical = src.filter(p => p.seoScore < 40 || p.aiScore < 40).length;
    const good     = src.filter(p => p.seoScore >= 75 && p.aiScore >= 75).length;
    return { total: src.length, avgSeo, avgAi, critical, good };
  }, [pages]);

  const criticalCount = pages.filter(p => p.seoScore < 40 || p.aiScore < 40).length;

  const FILTERS: { key: FilterType; label: string; count: number }[] = [
    { key: 'all',      label: 'All',      count: pages.length },
    { key: 'blog',     label: 'Blog',     count: pages.filter(p => p.type === 'blog').length },
    { key: 'event',    label: 'Events',   count: pages.filter(p => p.type === 'event').length },
    { key: 'page',     label: 'Pages',    count: pages.filter(p => p.type === 'page').length },
    { key: 'critical', label: '🔴 Critical', count: criticalCount },
  ];

  return (
    <div>
      {/* ── Header ── */}
      <div className="swa-page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="swa-page-title">SEO &amp; AISEO Report</h1>
          <p className="swa-page-subtitle">
            Audit every published page for traditional SEO and LLM/AI-search readiness.
            {genAt && <span style={{ color: 'var(--color-text-faint)', marginLeft: 8, fontSize: 12 }}>
              Generated {new Date(genAt).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!loading && pages.length > 0 && (
            <button className="swa-btn" style={{ fontSize: 13 }} onClick={() => exportCsv(pages)}>
              ↓ Export CSV
            </button>
          )}
          <Link href="/admin/seo" className="swa-btn" style={{ fontSize: 13 }}>
            ✨ SEO Generator →
          </Link>
          <button className="swa-btn swa-btn--primary" onClick={loadReport} disabled={loading}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {error && <div className="swa-alert swa-alert--error" style={{ marginBottom: 20 }}>{error}</div>}

      {/* ── Summary cards ── */}
      {stats && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total pages', value: stats.total, sub: 'published' },
            { label: 'Avg SEO score', value: stats.avgSeo, sub: `Grade ${grade(stats.avgSeo)}`, color: scoreColor(stats.avgSeo) },
            { label: 'Avg AISEO score', value: stats.avgAi, sub: `Grade ${grade(stats.avgAi)}`, color: scoreColor(stats.avgAi) },
            { label: 'Need attention', value: stats.critical, sub: 'score < 40', color: stats.critical > 0 ? '#dc2626' : '#16a34a', clickFilter: 'critical' as FilterType },
            { label: 'Fully optimised', value: stats.good, sub: 'both scores ≥ 75', color: '#16a34a' },
          ].map(s => (
            <div
              key={s.label}
              className="swa-card"
              style={{ padding: '16px 18px', cursor: (s as { clickFilter?: FilterType }).clickFilter ? 'pointer' : undefined }}
              onClick={(s as { clickFilter?: FilterType }).clickFilter ? () => setFilter((s as { clickFilter: FilterType }).clickFilter) : undefined}
            >
              <div style={{ fontSize: 26, fontWeight: 800, color: (s as { color?: string }).color ?? 'var(--color-text-primary)', lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Controls ── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 2, background: '#f3f4f6', padding: 4, borderRadius: 10 }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} className="swa-btn" style={{
              padding: '5px 14px', fontSize: 12, borderRadius: 7,
              background:  filter === f.key ? '#fff' : 'transparent',
              color:       filter === f.key ? (f.key === 'critical' ? '#dc2626' : 'var(--color-primary)') : 'var(--color-text-muted)',
              fontWeight:  filter === f.key ? 700 : 500,
              boxShadow:   filter === f.key ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
            }}>
              {f.label} <span style={{ opacity: 0.6 }}>({f.count})</span>
            </button>
          ))}
        </div>

        <input
          type="search"
          placeholder="Search pages…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, width: 200, background: 'var(--color-bg-input, #fff)' }}
        />

        <select value={sort} onChange={e => setSort(e.target.value as SortKey)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, background: 'var(--color-bg-input, #fff)' }}>
          <option value="combined">Sort: Combined score</option>
          <option value="seoScore">Sort: SEO score</option>
          <option value="aiScore">Sort: AISEO score</option>
          <option value="title">Sort: Title A–Z</option>
        </select>

        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-text-faint)' }}>
          {loading ? 'Analysing…' : `${filtered.length} page${filtered.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* ── Table ── */}
      <div className="swa-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading && (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--color-text-faint)', fontSize: 14 }}>
            Analysing all published pages…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--color-text-faint)', fontSize: 14 }}>
            No pages match your filter.
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <table className="swa-table" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '38%' }} />
              <col style={{ width: '9%'  }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th>Page</th>
                <th>Type</th>
                <th style={{ textAlign: 'center' }}>
                  SEO
                  <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--color-text-faint)' }}>meta · image · content</div>
                </th>
                <th style={{ textAlign: 'center' }}>
                  AISEO
                  <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--color-text-faint)' }}>facts · entity · structure</div>
                </th>
                <th>Top issues</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const isOpen = expanded === p.id;
                const combined = Math.round((p.seoScore + p.aiScore) / 2);
                // Highest-impact issues across both domains, deduplicated
                const issues = [
                  ...topIssues(p.seoChecks, 2),
                  ...topIssues(p.aiChecks, 2),
                ].sort((a, b) => (b.max - b.points) - (a.max - a.points)).slice(0, 3);
                const isCritical = p.seoScore < 40 || p.aiScore < 40;

                return [
                  <tr
                    key={p.id}
                    onClick={() => setExpanded(isOpen ? null : p.id)}
                    style={{
                      cursor: 'pointer',
                      background: isOpen
                        ? 'var(--color-bg-subtle, #f9fafb)'
                        : isCritical ? '#fff5f5' : undefined,
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ScoreBadge score={combined} size="sm" />
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.title}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-faint)', marginTop: 1 }}>
                            /{p.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{typeLabel(p.type)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <ScoreBar score={p.seoScore} />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <ScoreBar score={p.aiScore} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {issues.length === 0 ? (
                        <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>✓ Fully optimised</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {issues.map(i => (
                            <div key={i.key} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                              {statusIcon(i.status)}
                              <span style={{ color: 'var(--color-text-body)' }}>{i.label}</span>
                              <span style={{ color: 'var(--color-text-faint)', fontSize: 10 }}>−{i.max - i.points}pts</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>,

                  isOpen && (
                    <tr key={`${p.id}-detail`} style={{ background: 'var(--color-bg-subtle, #f9fafb)' }}>
                      <td colSpan={5} style={{ padding: '0 16px 20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                              <ScoreBadge score={p.seoScore} />
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>SEO Score: {p.seoScore}/100</div>
                                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Traditional search optimisation</div>
                              </div>
                            </div>
                            <ChecksTable checks={p.seoChecks} title="SEO Checks" />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                              <ScoreBadge score={p.aiScore} />
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>AISEO Score: {p.aiScore}/100</div>
                                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>LLM / AI-search readiness</div>
                              </div>
                            </div>
                            <ChecksTable checks={p.aiChecks} title="AISEO Checks" />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
                          <a href={p.url} target="_blank" rel="noopener noreferrer" className="swa-btn" style={{ fontSize: 12 }}>
                            ↗ View page
                          </a>
                          <Link href={p.editUrl} className="swa-btn swa-btn--primary" style={{ fontSize: 12 }}>
                            ✏ Edit
                          </Link>
                          {p.aiScore < 90 && (
                            <Link href={`/admin/seo/optimize?id=${p.id}&type=${p.type}`} className="swa-btn" style={{ fontSize: 12, background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe' }}>
                              🤖 AI Optimise
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Legend ── */}
      {!loading && pages.length > 0 && (
        <div style={{ marginTop: 20, display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12, color: 'var(--color-text-muted)' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Score guide:</span>
          {[['A (90–100)', '#16a34a'], ['B (75–89)', '#16a34a'], ['C (55–74)', '#d97706'], ['D (35–54)', '#dc2626'], ['F (0–34)', '#dc2626']].map(([l, c]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: c as string, display: 'inline-block' }} />
              {l}
            </span>
          ))}
          <span style={{ marginLeft: 'auto', color: 'var(--color-text-faint)' }}>Click any row to expand · AISEO = LLM/AI-search readiness</span>
        </div>
      )}
    </div>
  );
}
