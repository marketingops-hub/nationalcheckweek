"use client";

/*
 * /admin/seo/llm  — LLM Indexing Dashboard
 *
 * Equivalent of a WordPress LLM plugin settings page.
 * Three tabs:
 *   1. llms.txt  — preview the live manifest + copy / open link
 *   2. Markdown preview  — test any URL to see what AI bots receive
 *   3. Bot guide  — which bots are supported and what they do
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/adminFetch';

type Tab = 'manifest' | 'preview' | 'bots';

const BASE = typeof window !== 'undefined' ? window.location.origin : 'https://nationalcheckinweek.com';

/* ─── Bots list ──────────────────────────────────────────────────────────── */

const AI_BOTS = [
  { name: 'GPTBot',             company: 'OpenAI',      product: 'ChatGPT & GPT-4o browsing',    status: 'active' },
  { name: 'ChatGPT-User',       company: 'OpenAI',      product: 'ChatGPT real-time browsing',   status: 'active' },
  { name: 'ClaudeBot',          company: 'Anthropic',   product: 'Claude AI training & search',  status: 'active' },
  { name: 'Anthropic-AI',       company: 'Anthropic',   product: 'Anthropic crawlers',           status: 'active' },
  { name: 'PerplexityBot',      company: 'Perplexity',  product: 'Perplexity AI search',         status: 'active' },
  { name: 'Perplexity-User',    company: 'Perplexity',  product: 'Perplexity real-time answers', status: 'active' },
  { name: 'Google-Extended',    company: 'Google',      product: 'Gemini & AI Overviews',        status: 'active' },
  { name: 'Googlebot-Extended', company: 'Google',      product: 'Google AI content crawl',      status: 'active' },
  { name: 'cohere-ai',          company: 'Cohere',      product: 'Command & Embed models',       status: 'active' },
  { name: 'CCBot',              company: 'Common Crawl','product': 'Open AI training dataset',   status: 'active' },
  { name: 'Applebot-Extended',  company: 'Apple',       product: 'Apple Intelligence',           status: 'active' },
  { name: 'meta-externalagent', company: 'Meta',        product: 'Meta AI & Llama training',     status: 'active' },
  { name: 'Bytespider',         company: 'ByteDance',   product: 'Douyin / TikTok AI features',  status: 'active' },
  { name: 'YouBot',             company: 'You.com',     product: 'You.com AI search',            status: 'active' },
  { name: 'OAI-SearchBot',      company: 'OpenAI',      product: 'SearchGPT index',              status: 'active' },
  { name: 'Diffbot',            company: 'Diffbot',     product: 'Structured knowledge graph',   status: 'active' },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: copied ? '#f0fdf4' : '#f3f4f6', border: `1px solid ${copied ? '#86efac' : '#e5e7eb'}`, color: copied ? '#16a34a' : '#374151', cursor: 'pointer', fontWeight: 600 }}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */

export default function LlmIndexingPage() {
  const [tab,         setTab]         = useState<Tab>('manifest');
  const [manifest,    setManifest]    = useState('');
  const [manifestLoading, setManifestLoading] = useState(false);
  const [previewPath, setPreviewPath] = useState('/blog/');
  const [previewMd,   setPreviewMd]   = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError,   setPreviewError]   = useState('');

  /* ── Load manifest ── */
  const loadManifest = useCallback(() => {
    setManifestLoading(true);
    fetch('/llms.txt')
      .then(r => r.text())
      .then(t => { setManifest(t); setManifestLoading(false); })
      .catch(() => { setManifest('Failed to load /llms.txt'); setManifestLoading(false); });
  }, []);

  useEffect(() => { if (tab === 'manifest') loadManifest(); }, [tab, loadManifest]);

  /* ── Preview markdown ── */
  const previewMarkdown = useCallback(() => {
    if (!previewPath.trim()) return;
    setPreviewLoading(true);
    setPreviewError('');
    setPreviewMd('');
    fetch(`/api/llms-md?path=${encodeURIComponent(previewPath)}`)
      .then(async r => {
        const text = await r.text();
        if (!r.ok) setPreviewError(text);
        else setPreviewMd(text);
        setPreviewLoading(false);
      })
      .catch(e => { setPreviewError(e.message); setPreviewLoading(false); });
  }, [previewPath]);

  const TAB_STYLES = (active: boolean) => ({
    padding: '8px 18px', fontSize: 13, borderRadius: 8, border: 'none', cursor: 'pointer',
    background: active ? '#fff' : 'transparent',
    color:      active ? 'var(--color-primary, #3b82f6)' : '#6b7280',
    fontWeight: active ? 700 : 500,
    boxShadow:  active ? '0 1px 4px rgba(0,0,0,.10)' : 'none',
  });

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div className="swa-page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="swa-page-title">LLM Indexing</h1>
          <p className="swa-page-subtitle">
            Generative Engine Optimization (GEO) — control how AI crawlers read and index your site.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/admin/seo/optimize" className="swa-btn" style={{ fontSize: 13 }}>🤖 LLM Optimiser</Link>
          <Link href="/admin/seo/report"   className="swa-btn" style={{ fontSize: 13 }}>📊 SEO Report</Link>
        </div>
      </div>

      {/* Explainer cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          {
            icon: 'description', color: '#3b82f6', bg: '#eff6ff',
            title: '/llms.txt manifest',
            desc: 'A dynamic index file — the "robots.txt for AI." Lists every published page with one-line descriptions. AI bots like GPTBot and ClaudeBot request this first to understand your site.',
            href: '/llms.txt', hrefLabel: 'View /llms.txt →',
          },
          {
            icon: 'code', color: '#7c3aed', bg: '#faf5ff',
            title: 'Markdown interception',
            desc: 'When a known AI crawler visits any page, middleware rewrites their request to /api/llms-md, serving clean Markdown instead of HTML. Cuts token cost by ~70% and improves citation accuracy.',
            href: null, hrefLabel: null,
          },
          {
            icon: 'smart_toy', color: '#0891b2', bg: '#f0fdfa',
            title: `${AI_BOTS.length} bots supported`,
            desc: 'Covers GPTBot, ClaudeBot, PerplexityBot, Googlebot-Extended, Cohere, Apple Intelligence, Meta AI, and more. New bots can be added to the middleware signature list.',
            href: null, hrefLabel: null,
          },
        ].map(c => (
          <div key={c.title} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: c.color }}>{c.icon}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{c.title}</div>
            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, marginBottom: c.href ? 10 : 0 }}>{c.desc}</div>
            {c.href && (
              <a href={c.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: c.color, fontWeight: 600, textDecoration: 'none' }}>
                {c.hrefLabel}
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Architecture diagram */}
      <div style={{ background: '#0f172a', borderRadius: 12, padding: '20px 24px', marginBottom: 28, fontFamily: 'monospace', fontSize: 12, color: '#94a3b8', lineHeight: 1.8 }}>
        <div style={{ color: '#64748b', fontSize: 11, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>How it works</div>
        <pre style={{ margin: 0, color: '#94a3b8', whiteSpace: 'pre' }}>{`[ AI Scraper ]  ──▶  ( Visits any page )  ──▶  [ Next.js Middleware ]
      ▲                                                     │
      │                  Detects bot user-agent             │
      │                  Rewrites to /api/llms-md           ▼
( Reads clean )  ◀──  ( Converts DB content )  ◀──  [ /api/llms-md ]
  Markdown                to Markdown                  Node route

[ AI Scraper ]  ──▶  ( Requests /llms.txt )  ──▶  [ Dynamic manifest ]
                                                    All published pages
                                                    + brand facts`}</pre>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, background: '#f3f4f6', padding: 4, borderRadius: 10, marginBottom: 20, width: 'fit-content' }}>
        {([
          ['manifest', 'description', '/llms.txt manifest'],
          ['preview',  'preview',     'Markdown preview'],
          ['bots',     'smart_toy',   'Supported bots'],
        ] as const).map(([id, icon, label]) => (
          <button key={id} onClick={() => setTab(id)} style={TAB_STYLES(tab === id)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{icon}</span>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* ── Tab: Manifest ── */}
      {tab === 'manifest' && (
        <div className="swa-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Live /llms.txt manifest</span>
              <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>Generated dynamically from your published content · refreshes every hour</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {manifest && <CopyButton text={manifest} />}
              <a href="/llms.txt" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>
                Open ↗
              </a>
              <button onClick={loadManifest} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', cursor: 'pointer', fontWeight: 500 }}>
                ↻ Refresh
              </button>
            </div>
          </div>
          {manifestLoading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#9ca3af' }}>Loading manifest…</div>
          ) : (
            <pre style={{ margin: 0, padding: '20px 24px', fontSize: 12, lineHeight: 1.7, color: '#374151', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 600, overflow: 'auto', background: '#fdfdfd', fontFamily: '"SF Mono", "Fira Code", monospace' }}>
              {manifest}
            </pre>
          )}
          <div style={{ padding: '12px 18px', borderTop: '1px solid #e5e7eb', background: '#f9fafb', fontSize: 12, color: '#6b7280' }}>
            This file is served at <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>nationalcheckinweek.com/llms.txt</code> — AI crawlers discover it by convention (like robots.txt).
          </div>
        </div>
      )}

      {/* ── Tab: Markdown preview ── */}
      {tab === 'preview' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              type="text"
              value={previewPath}
              onChange={e => setPreviewPath(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && previewMarkdown()}
              placeholder="/blog/your-post-slug"
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, fontFamily: 'monospace', background: 'var(--color-bg-input,#fff)' }}
            />
            <button className="swa-btn swa-btn--primary" onClick={previewMarkdown} disabled={previewLoading} style={{ fontSize: 13 }}>
              {previewLoading ? 'Loading…' : 'Preview Markdown →'}
            </button>
          </div>

          {/* Quick examples */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#9ca3af', alignSelf: 'center' }}>Try:</span>
            {['/blog/', '/events/', '/issues/', '/faq', '/about'].map(p => (
              <button key={p} onClick={() => { setPreviewPath(p); }} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 12, background: '#f3f4f6', border: '1px solid #e5e7eb', cursor: 'pointer', color: '#374151', fontFamily: 'monospace' }}>
                {p}
              </button>
            ))}
          </div>

          <div className="swa-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>
                What AI bots receive for <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>{previewPath}</code>
              </span>
              {previewMd && <CopyButton text={previewMd} />}
            </div>
            {previewError && (
              <div style={{ padding: '16px 18px', background: '#fef2f2', color: '#dc2626', fontSize: 13 }}>{previewError}</div>
            )}
            {!previewMd && !previewError && (
              <div style={{ padding: '60px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                Enter a page path above and click "Preview Markdown →"
              </div>
            )}
            {previewMd && (
              <>
                <pre style={{ margin: 0, padding: '20px 24px', fontSize: 12, lineHeight: 1.7, color: '#374151', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 560, overflow: 'auto', fontFamily: '"SF Mono", "Fira Code", monospace' }}>
                  {previewMd}
                </pre>
                <div style={{ padding: '10px 18px', borderTop: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', gap: 16, fontSize: 11, color: '#6b7280' }}>
                  <span>~{Math.round(previewMd.length / 4)} tokens estimated</span>
                  <span>·</span>
                  <span>{previewMd.split('\n').length} lines</span>
                  <span>·</span>
                  <span>{previewMd.length.toLocaleString()} characters</span>
                  <span>·</span>
                  <a href={`/api/llms-md?path=${encodeURIComponent(previewPath)}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>Open raw ↗</a>
                </div>
              </>
            )}
          </div>

          <div style={{ marginTop: 12, padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
            <strong>How the interception works:</strong> When GPTBot visits <code>/blog/your-post</code>, the Next.js middleware detects its user-agent and silently rewrites the request to <code>/api/llms-md?path=/blog/your-post</code>. The bot receives clean Markdown — no nav, no scripts, no sidebars. This typically reduces token usage by 60–75% and improves citation accuracy.
          </div>
        </div>
      )}

      {/* ── Tab: Bots ── */}
      {tab === 'bots' && (
        <div>
          <div style={{ marginBottom: 14, padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, color: '#15803d' }}>
            <strong>All {AI_BOTS.length} bots below are intercepted</strong> — they receive clean Markdown from <code>/api/llms-md</code> instead of raw HTML. Add new signatures to <code>src/middleware.ts</code> as new AI crawlers emerge.
          </div>
          <div className="swa-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="swa-table">
              <thead>
                <tr>
                  <th>Bot signature</th>
                  <th>Company</th>
                  <th>Product / use</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {AI_BOTS.map(b => (
                  <tr key={b.name}>
                    <td><code style={{ fontSize: 12, background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{b.name}</code></td>
                    <td style={{ fontSize: 13, fontWeight: 600 }}>{b.company}</td>
                    <td style={{ fontSize: 13, color: '#6b7280' }}>{b.product}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#f0fdf4', color: '#16a34a', fontWeight: 600 }}>✓ Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 20, padding: '16px 18px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Adding a new bot</div>
            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
              Edit <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 4 }}>src/middleware.ts</code> and add the new bot's user-agent substring to the <code>AI_BOT_SIGNATURES</code> array. Deploy — no database changes needed.
            </div>
            <pre style={{ marginTop: 10, padding: '10px 14px', background: '#0f172a', borderRadius: 8, fontSize: 12, color: '#94a3b8', whiteSpace: 'pre-wrap' }}>{`// src/middleware.ts
const AI_BOT_SIGNATURES = [
  'GPTBot',
  'ClaudeBot',
  // Add new bot here:
  'NewAIBot',
  ...
];`}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
