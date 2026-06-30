"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/vault/sources — the Vault library.
 *
 * Grid of documents. One card per document (not per chunk). Status chips
 * show live pipeline state. Filters narrow by status / kind / category.
 * Search is server-side (title + source ilike).
 *
 * Replaces the old two-tab bookmarks / content-blocks UI — vault_sources is
 * gone, vault_content is auto-migrated into vault_documents.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { listDocuments, deleteDocument, reindexDocument } from "@/lib/vault/client";
import {
  DOCUMENT_KIND_ICONS,
  DOCUMENT_KIND_LABELS,
  STATUS_IS_TERMINAL,
  isDocStuck,
  type VaultDocument,
  type DocumentStatus,
  type DocumentKind,
} from "@/lib/vault/types";
import { StatusChip } from "../upload/page";

const STATUS_OPTIONS: (DocumentStatus | 'all')[] = [
  'all', 'ready', 'pending', 'extracting', 'chunking', 'embedding', 'failed',
];

/** Short "x ago" string so the user can see whether an in-flight doc is
 *  actually advancing (fresh) or frozen (minutes old). */
function relTime(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 5)   return 'just now';
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

/** Human progress line for an in-flight (non-terminal) document. */
function progressLabel(doc: VaultDocument): string {
  if (isDocStuck(doc)) return `Looks stuck in "${doc.status}" — click Re-index to resume`;
  switch (doc.status) {
    case 'pending':    return 'Queued — waiting for the indexer…';
    case 'extracting': return doc.page_count
      ? `Extracting — page ${Math.min(doc.extract_cursor ?? 0, doc.page_count)} of ${doc.page_count} · ${doc.chunk_count} chunks`
      : `Extracting — ${doc.chunk_count} chunks so far`;
    case 'chunking':   return 'Chunking text…';
    case 'embedding':  return `Embedding — ${doc.chunk_count} chunks`;
    default:           return doc.status;
  }
}

const KIND_OPTIONS: (DocumentKind | 'all')[] = ['all', 'pdf', 'docx', 'txt', 'url', 'paste'];

export default function VaultLibraryPage() {
  const [docs, setDocs]       = useState<VaultDocument[]>([]);
  const [search, setSearch]   = useState("");
  const [status, setStatus]   = useState<DocumentStatus | 'all'>('all');
  const [kind,   setKind]     = useState<DocumentKind   | 'all'>('all');
  const [category, setCategory] = useState<string | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listDocuments({
        status: status === 'all' ? undefined : status,
        kind:   kind   === 'all' ? undefined : kind,
        category: category === 'all' ? undefined : category,
        search: search || undefined,
        limit: 300,
      });
      setDocs(data);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [status, kind, category, search]);

  useEffect(() => { refresh(); }, [refresh]);

  // Poll while anything is mid-pipeline so progress is visible without a reload.
  useEffect(() => {
    const pending = docs.some((d) => !STATUS_IS_TERMINAL[d.status]);
    if (!pending) return;
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, [docs, refresh]);

  // Auto-resume stalled documents. A PDF page can OOM-kill the indexer worker
  // uncatchably, which also kills the self-trigger that would continue the
  // job — so a doc can sit non-terminal with no progress. The indexer
  // pre-claims each page in extract_cursor before touching it, so simply
  // re-firing the indexer resumes PAST the poison page. While this page is
  // open we detect a stall (no updated_at change for ~45s) and re-fire it,
  // at most once per cooldown, so the doc grinds to completion on its own.
  const autoResumedRef = useRef<Map<string, number>>(new Map());
  useEffect(() => {
    const STALL_MS = 45_000;
    const COOLDOWN_MS = 45_000;
    const now = Date.now();
    for (const d of docs) {
      if (STATUS_IS_TERMINAL[d.status]) continue;
      if (now - new Date(d.updated_at).getTime() < STALL_MS) continue;
      const last = autoResumedRef.current.get(d.id) ?? 0;
      if (now - last < COOLDOWN_MS) continue;
      autoResumedRef.current.set(d.id, now);
      reindexDocument(d.id).then(() => refresh()).catch(() => {});
    }
  }, [docs, refresh]);

  // Stats strip — the whole vault at a glance.
  const stats = useMemo(() => {
    const ready    = docs.filter((d) => d.status === 'ready').length;
    const failed   = docs.filter((d) => d.status === 'failed').length;
    const busy     = docs.filter((d) => !STATUS_IS_TERMINAL[d.status]).length;
    const chunks   = docs.reduce((s, d) => s + (d.chunk_count ?? 0), 0);
    const tokens   = docs.reduce((s, d) => s + (d.token_count ?? 0), 0);
    const categories = Array.from(new Set(docs.map((d) => d.category))).sort();
    return { total: docs.length, ready, failed, busy, chunks, tokens, categories };
  }, [docs]);

  async function onDelete(doc: VaultDocument) {
    if (!confirm(`Delete "${doc.title}"? This removes the document, its ${doc.chunk_count} chunks and its original file. Cannot be undone.`)) return;
    try {
      await deleteDocument(doc.id);
      setDocs((d) => d.filter((x) => x.id !== doc.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onReindex(doc: VaultDocument) {
    try {
      const updated = await reindexDocument(doc.id);
      setDocs((d) => d.map((x) => (x.id === doc.id ? updated : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Vault library</h1>
          <p className="swa-page-subtitle">
            Everything the AI can read when it generates or verifies content. Each document is
            chunked and embedded for semantic retrieval.
          </p>
        </div>
        <Link href="/admin/vault/upload" className="swa-btn swa-btn--primary">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span>
          Upload
        </Link>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        <Stat label="Documents" value={stats.total} />
        <Stat label="Ready"     value={stats.ready}  tone={stats.ready > 0 ? 'good' : 'neutral'} />
        <Stat label="Indexing…" value={stats.busy}   tone={stats.busy > 0 ? 'busy' : 'neutral'} />
        <Stat label="Chunks"    value={stats.chunks} />
        <Stat label="Tokens"    value={stats.tokens.toLocaleString()} />
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title or source…"
          style={{ flex: 1, minWidth: 220, padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14 }}
        />

        <FilterSelect
          label="Status"
          value={status}
          onChange={(v) => setStatus(v as DocumentStatus | 'all')}
          options={STATUS_OPTIONS.map((s) => ({ value: s, label: s === 'all' ? 'All statuses' : s }))}
        />
        <FilterSelect
          label="Kind"
          value={kind}
          onChange={(v) => setKind(v as DocumentKind | 'all')}
          options={KIND_OPTIONS.map((k) => ({ value: k, label: k === 'all' ? 'All types' : DOCUMENT_KIND_LABELS[k] }))}
        />
        <FilterSelect
          label="Category"
          value={category}
          onChange={setCategory}
          options={[{ value: 'all', label: 'All categories' }, ...stats.categories.map((c) => ({ value: c, label: c }))]}
        />
      </div>

      {error && <div className="swa-alert swa-alert--error" style={{ marginBottom: 20 }}>{error}</div>}

      {loading && docs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>hourglass_empty</span>
          Loading…
        </div>
      ) : docs.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {docs.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onDelete={onDelete} onReindex={onReindex} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Components ─────────────────────────────────────────────────────── */

function Stat({ label, value, tone = 'neutral' as 'neutral' | 'good' | 'busy' }: { label: string; value: number | string; tone?: 'neutral' | 'good' | 'busy' }) {
  const colour =
    tone === 'good' ? '#047857' :
    tone === 'busy' ? '#B45309' : '#1b4673';
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: colour }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: '7px 10px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 13, background: '#fff' }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function DocumentCard({
  doc, onDelete, onReindex,
}: {
  doc: VaultDocument;
  onDelete: (d: VaultDocument) => void;
  onReindex: (d: VaultDocument) => void;
}) {
  const failed = doc.status === 'failed';
  const stuck  = isDocStuck(doc);
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: 16,
      border: `1px solid ${failed ? '#FCA5A5' : '#E5E7EB'}`,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#1b4673' }}>
          {DOCUMENT_KIND_ICONS[doc.kind]}
        </span>
        <Link href={`/admin/vault/sources/${doc.id}`} style={{ flex: 1, minWidth: 0, color: '#1b4673', textDecoration: 'none' }}>
          <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {doc.title}
          </div>
        </Link>
        <StatusChip status={doc.status} />
      </div>

      {doc.source && doc.kind === 'url' && (
        <a href={doc.source} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {doc.source}
        </a>
      )}

      {failed && doc.status_error && (
        <div style={{ fontSize: 12, color: '#B91C1C', background: '#FEF2F2', padding: 8, borderRadius: 6 }}>
          {doc.status_error}
        </div>
      )}

      {/* Live progress for in-flight docs: what stage, how far, and how fresh
          the last update is — so a re-index is visibly moving (or visibly
          stuck). The list auto-polls every 4s, so this updates on its own. */}
      {!STATUS_IS_TERMINAL[doc.status] && (
        <div style={{
          fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 8px', borderRadius: 6,
          background: stuck ? '#FEF3C7' : '#E0F2FE',
          color: stuck ? '#92400E' : '#0C5A78',
        }}>
          <span
            className={`material-symbols-outlined${stuck ? '' : ' swa-spin'}`}
            style={{ fontSize: 14 }}
            aria-hidden
          >
            {stuck ? 'warning' : 'progress_activity'}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>{progressLabel(doc)}</span>
          <span style={{ color: '#6B7280', whiteSpace: 'nowrap' }}>upd. {relTime(doc.updated_at)}</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#9CA3AF', marginTop: 'auto' }}>
        <span style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: 4, fontWeight: 600, color: '#374151' }}>
          {doc.category}
        </span>
        <span>{doc.chunk_count} chunks</span>
        {doc.token_count !== null && <span>· {doc.token_count.toLocaleString()} tok</span>}
        <span style={{ marginLeft: 'auto' }}>{new Date(doc.created_at).toLocaleDateString()}</span>
      </div>

      {/* Footer actions */}
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        {(failed || stuck) && (
          <button onClick={() => onReindex(doc)} className="swa-btn" style={{ fontSize: 12, padding: '4px 10px' }}>
            {stuck ? 'Re-index (stuck)' : 'Retry'}
          </button>
        )}
        <button
          onClick={() => onDelete(doc)}
          className="swa-icon-btn"
          title="Delete"
          style={{ color: '#EF4444', marginLeft: 'auto' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px', color: '#9CA3AF', border: '1px dashed #E5E7EB', borderRadius: 12 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 48, display: 'block', marginBottom: 16, color: '#D1D5DB' }}>inventory_2</span>
      <h3 style={{ color: '#1b4673', marginBottom: 8 }}>Your vault is empty</h3>
      <p style={{ marginBottom: 20 }}>Upload PDFs, paste text, or crawl a URL to give the AI something to work with.</p>
      <Link href="/admin/vault/upload" className="swa-btn swa-btn--primary">Upload a document</Link>
    </div>
  );
}
