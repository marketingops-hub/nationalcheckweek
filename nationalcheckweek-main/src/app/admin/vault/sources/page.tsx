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

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listDocuments, deleteDocument, reindexDocument } from "@/lib/vault/client";
import {
  DOCUMENT_KIND_ICONS,
  DOCUMENT_KIND_LABELS,
  STATUS_IS_TERMINAL,
  type VaultDocument,
  type DocumentStatus,
  type DocumentKind,
} from "@/lib/vault/types";
import { StatusChip } from "../upload/page";

const STATUS_OPTIONS: (DocumentStatus | 'all')[] = [
  'all', 'ready', 'pending', 'extracting', 'chunking', 'embedding', 'failed',
];

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
    tone === 'busy' ? '#B45309' : '#1E1040';
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
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: 16,
      border: `1px solid ${failed ? '#FCA5A5' : '#E5E7EB'}`,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#1E1040' }}>
          {DOCUMENT_KIND_ICONS[doc.kind]}
        </span>
        <Link href={`/admin/vault/sources/${doc.id}`} style={{ flex: 1, minWidth: 0, color: '#1E1040', textDecoration: 'none' }}>
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
        {failed && (
          <button onClick={() => onReindex(doc)} className="swa-btn" style={{ fontSize: 12, padding: '4px 10px' }}>
            Retry
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
      <h3 style={{ color: '#1E1040', marginBottom: 8 }}>Your vault is empty</h3>
      <p style={{ marginBottom: 20 }}>Upload PDFs, paste text, or crawl a URL to give the AI something to work with.</p>
      <Link href="/admin/vault/upload" className="swa-btn swa-btn--primary">Upload a document</Link>
    </div>
  );
}
