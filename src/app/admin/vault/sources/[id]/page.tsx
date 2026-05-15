"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/vault/sources/[id] — document detail.
 *
 * Shows:
 *   • header with editable title (inline), kind icon, status chip, source link
 *   • meta strip: chunks, tokens, chars, category, tags, added / updated
 *   • chunk preview list — what the AI actually sees at retrieval time
 *   • sidebar actions: Re-index, Delete, Edit metadata
 *
 * Polls the document while status is non-terminal so the admin can watch the
 * pipeline progress live.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getDocument,
  patchDocument,
  deleteDocument,
  reindexDocument,
} from "@/lib/vault/client";
import {
  DOCUMENT_KIND_ICONS,
  DOCUMENT_KIND_LABELS,
  STATUS_IS_TERMINAL,
  type VaultDocumentDetail,
} from "@/lib/vault/types";
import { StatusChip } from "../../upload/page";

export default function VaultDocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [doc,       setDoc]     = useState<VaultDocumentDetail | null>(null);
  const [loading,   setLoading] = useState(true);
  const [error,     setError]   = useState("");

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft,   setTitleDraft]   = useState("");
  const [categoryDraft, setCategoryDraft] = useState("");
  const [tagsDraft,    setTagsDraft]    = useState("");
  const [savingMeta,   setSavingMeta]   = useState(false);

  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    try {
      const d = await getDocument(id);
      setDoc(d);
      setTitleDraft(d.title);
      setCategoryDraft(d.category);
      setTagsDraft(d.tags.join(', '));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  // Poll while the pipeline is running.
  useEffect(() => {
    if (!doc) return;
    if (STATUS_IS_TERMINAL[doc.status]) return;
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, [doc, refresh]);

  async function saveTitle() {
    if (!doc || titleDraft.trim() === doc.title) {
      setEditingTitle(false);
      return;
    }
    try {
      setSavingMeta(true);
      const updated = await patchDocument(doc.id, { title: titleDraft.trim() });
      setDoc((d) => (d ? { ...d, ...updated } : d));
      setEditingTitle(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingMeta(false);
    }
  }

  async function saveMeta() {
    if (!doc) return;
    try {
      setSavingMeta(true);
      const tags = tagsDraft.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 20);
      const updated = await patchDocument(doc.id, {
        category: categoryDraft.trim() || 'general',
        tags,
      });
      setDoc((d) => (d ? { ...d, ...updated } : d));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingMeta(false);
    }
  }

  async function onReindex() {
    if (!doc) return;
    try {
      const updated = await reindexDocument(doc.id);
      setDoc((d) => (d ? { ...d, ...updated } : d));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onDelete() {
    if (!doc) return;
    if (!confirm(`Delete "${doc.title}"? Removes ${doc.chunk_count} chunks and the original file. Cannot be undone.`)) return;
    try {
      await deleteDocument(doc.id);
      router.push('/admin/vault/sources');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function toggleChunk(chunkId: string) {
    setExpandedChunks((prev) => {
      const next = new Set(prev);
      if (next.has(chunkId)) next.delete(chunkId);
      else next.add(chunkId);
      return next;
    });
  }

  if (loading) return <div style={{ padding: 40, color: '#9CA3AF' }}>Loading…</div>;
  if (!doc) return <div className="swa-alert swa-alert--error">Document not found.</div>;

  return (
    <div>
      <div className="swa-page-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Link href="/admin/vault/sources" style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none' }}>
              ← Vault library
            </Link>
            <span style={{ color: '#D1D5DB' }}>·</span>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#1E1040' }}>
              {DOCUMENT_KIND_ICONS[doc.kind]}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
              {DOCUMENT_KIND_LABELS[doc.kind]}
            </span>
            <StatusChip status={doc.status} />
          </div>

          {editingTitle ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitleDraft(doc.title); setEditingTitle(false); } }}
                style={{ fontSize: 24, fontWeight: 700, color: '#1E1040', padding: '4px 8px', border: '1px solid #E5E7EB', borderRadius: 6, width: '100%' }}
              />
            </div>
          ) : (
            <h1
              className="swa-page-title"
              onClick={() => setEditingTitle(true)}
              title="Click to edit"
              style={{ cursor: 'pointer' }}
            >
              {doc.title}
            </h1>
          )}

          {doc.source && (
            doc.kind === 'url' ? (
              <a href={doc.source} target="_blank" rel="noreferrer" className="swa-page-subtitle" style={{ wordBreak: 'break-all' }}>
                {doc.source}
              </a>
            ) : (
              <p className="swa-page-subtitle" style={{ fontFamily: 'monospace', fontSize: 12 }}>{doc.source}</p>
            )
          )}
        </div>
      </div>

      {error && <div className="swa-alert swa-alert--error" style={{ marginBottom: 20 }}>{error}</div>}

      {doc.status === 'failed' && doc.status_error && (
        <div className="swa-alert swa-alert--error" style={{ marginBottom: 20 }}>
          <strong>Indexing failed:</strong> {doc.status_error}
          <button onClick={onReindex} className="swa-btn" style={{ marginLeft: 12, fontSize: 12, padding: '4px 10px' }}>
            Retry
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* ── Main: meta + chunk list ─────────────────────────────────── */}
        <div>
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <Meta label="Chunks" value={doc.chunk_count} />
            <Meta label="Tokens" value={doc.token_count?.toLocaleString() ?? '—'} />
            <Meta label="Chars"  value={doc.char_count?.toLocaleString() ?? '—'} />
            <Meta label="Category" value={doc.category} />
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1040', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Indexed chunks ({doc.chunks.length})
          </h3>

          {doc.chunks.length === 0 ? (
            <div style={{ padding: 24, color: '#9CA3AF', border: '1px dashed #E5E7EB', borderRadius: 12, textAlign: 'center' }}>
              {doc.status === 'ready'
                ? 'No chunks indexed yet — try Re-index.'
                : 'Chunks will appear here once indexing completes.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {doc.chunks.map((c) => {
                const expanded = expandedChunks.has(c.id);
                return (
                  <div key={c.id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12 }}>
                    <button
                      onClick={() => toggleChunk(c.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                        background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <span style={{
                        background: '#F3F4F6', color: '#374151', fontWeight: 700, fontSize: 11,
                        padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace',
                      }}>
                        #{c.chunk_index}
                      </span>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>{c.token_count} tokens</span>
                      <span style={{ flex: 1, fontSize: 13, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {expanded ? '' : c.content.slice(0, 140)}
                      </span>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#9CA3AF' }}>
                        {expanded ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                    {expanded && (
                      <pre style={{
                        marginTop: 10, padding: 10, background: '#F9FAFB', borderRadius: 6,
                        fontSize: 12, color: '#1F2937', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        fontFamily: 'ui-sans-serif, system-ui', lineHeight: 1.5,
                      }}>
                        {c.content}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Sidebar: actions + metadata form ────────────────────────── */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1040', marginBottom: 10 }}>Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={onReindex} className="swa-btn" disabled={!STATUS_IS_TERMINAL[doc.status]}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
                Re-index
              </button>
              <button onClick={onDelete} className="swa-btn" style={{ color: '#EF4444' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                Delete document
              </button>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1040', marginBottom: 10 }}>Metadata</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Category</span>
                <input
                  value={categoryDraft}
                  onChange={(e) => setCategoryDraft(e.target.value)}
                  onBlur={saveMeta}
                  style={{ padding: '7px 10px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 13 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Tags</span>
                <input
                  value={tagsDraft}
                  onChange={(e) => setTagsDraft(e.target.value)}
                  onBlur={saveMeta}
                  placeholder="comma, separated"
                  style={{ padding: '7px 10px', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 13 }}
                />
              </label>
              {savingMeta && <div style={{ fontSize: 11, color: '#6B7280' }}>Saving…</div>}
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, fontSize: 12, color: '#6B7280' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1040', marginBottom: 10 }}>Provenance</h3>
            <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 10px', margin: 0 }}>
              <dt>Kind</dt>    <dd>{DOCUMENT_KIND_LABELS[doc.kind]}</dd>
              <dt>Source</dt>  <dd style={{ wordBreak: 'break-all' }}>{doc.source ?? '—'}</dd>
              <dt>Status</dt>  <dd>{doc.status}</dd>
              <dt>Created</dt> <dd>{new Date(doc.created_at).toLocaleString()}</dd>
              <dt>Updated</dt> <dd>{new Date(doc.updated_at).toLocaleString()}</dd>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#1E1040' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginTop: 2 }}>{label}</div>
    </div>
  );
}
