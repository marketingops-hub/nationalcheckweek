"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/vault/upload — multi-modal ingestion page.
 *
 * Three input modes share one page so admins can pick whichever is fastest:
 *   • Drop files      (PDF / DOCX / TXT, multiple at once, queued)
 *   • Paste text      (title + content + category + tags)
 *   • Paste URL       (crawled via Firecrawl, chunked + embedded like a file)
 *
 * Every successful submit appears in the upload queue on the right. The
 * queue polls each document's status until it reaches 'ready' or 'failed'
 * so admins can see the pipeline working without switching pages.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  uploadFile,
  createDocument,
  getDocument,
} from "@/lib/vault/client";
import {
  DOCUMENT_KIND_ICONS,
  DOCUMENT_KIND_LABELS,
  STATUS_IS_TERMINAL,
  type VaultDocument,
  type DocumentStatus,
} from "@/lib/vault/types";

const ACCEPT_MIME = ".pdf,.docx,.txt,.md";
const MAX_FILES   = 10;
// 100 MB — matches UPLOAD_LIMITS.MAX_FILE_BYTES and the Storage bucket
// file_size_limit. Browser uploads go direct to Supabase Storage (signed
// URL), so Vercel's body-size limit doesn't apply.
const MAX_BYTES   = 100 * 1024 * 1024;

type InputMode = 'files' | 'paste' | 'url';

export default function VaultUploadPage() {
  const [mode, setMode] = useState<InputMode>('files');
  const [queue, setQueue] = useState<VaultDocument[]>([]);
  const [globalError, setGlobalError] = useState("");

  /* ─── File drop zone ─────────────────────────────────────────────────── */

  const [dragging, setDragging] = useState(false);
  const [category, setCategory] = useState('general');
  const [tags,     setTags]     = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFilesSelected = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).slice(0, MAX_FILES);
    if (arr.length === 0) return;

    setGlobalError("");
    for (const file of arr) {
      if (file.size > MAX_BYTES) {
        setGlobalError(`"${file.name}" is larger than ${Math.floor(MAX_BYTES / 1024 / 1024)} MB and was skipped.`);
        continue;
      }
      try {
        const doc = await uploadFile({
          file,
          category,
          tags: parseTags(tags),
        });
        setQueue((q) => [doc, ...q]);
      } catch (err) {
        setGlobalError(err instanceof Error ? err.message : String(err));
      }
    }
  }, [category, tags]);

  /* ─── Paste-text form ────────────────────────────────────────────────── */

  const [pasteTitle, setPasteTitle]       = useState("");
  const [pasteContent, setPasteContent]   = useState("");
  const [pasteSource,  setPasteSource]    = useState("");
  const [pasteCategory, setPasteCategory] = useState('general');
  const [pasteTags,    setPasteTags]      = useState("");
  const [pasteBusy,    setPasteBusy]      = useState(false);

  async function submitPaste(e: React.FormEvent) {
    e.preventDefault();
    setPasteBusy(true); setGlobalError("");
    try {
      const doc = await createDocument({
        kind: 'paste',
        title: pasteTitle.trim(),
        content: pasteContent.trim(),
        source: pasteSource.trim() || undefined,
        category: pasteCategory,
        tags: parseTags(pasteTags),
      });
      setQueue((q) => [doc, ...q]);
      setPasteTitle(""); setPasteContent(""); setPasteSource(""); setPasteTags("");
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : String(err));
    } finally {
      setPasteBusy(false);
    }
  }

  /* ─── Paste-URL form ─────────────────────────────────────────────────── */

  const [urlValue, setUrlValue]   = useState("");
  const [urlTitle, setUrlTitle]   = useState("");
  const [urlCat,   setUrlCat]     = useState('general');
  const [urlTags,  setUrlTags]    = useState("");
  const [urlBusy,  setUrlBusy]    = useState(false);

  async function submitUrl(e: React.FormEvent) {
    e.preventDefault();
    setUrlBusy(true); setGlobalError("");
    try {
      const doc = await createDocument({
        kind: 'url',
        url: urlValue.trim(),
        title: urlTitle.trim() || undefined,
        category: urlCat,
        tags: parseTags(urlTags),
      });
      setQueue((q) => [doc, ...q]);
      setUrlValue(""); setUrlTitle(""); setUrlTags("");
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : String(err));
    } finally {
      setUrlBusy(false);
    }
  }

  /* ─── Poll in-flight queue items ─────────────────────────────────────── */

  useEffect(() => {
    // Stop polling the moment every queue item reaches a terminal status.
    const pending = queue.filter((d) => !STATUS_IS_TERMINAL[d.status]);
    if (pending.length === 0) return;

    const timer = setInterval(async () => {
      for (const doc of pending) {
        try {
          const fresh = await getDocument(doc.id);
          setQueue((q) => q.map((d) => (d.id === doc.id ? { ...d, ...fresh } : d)));
        } catch {
          // Quiet — the row may have been deleted elsewhere. Poll will drop it.
        }
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [queue]);

  /* ─── Render ─────────────────────────────────────────────────────────── */

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Link href="/admin/vault/sources" style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none' }}>
              ← Vault library
            </Link>
          </div>
          <h1 className="swa-page-title">Upload to the Vault</h1>
          <p className="swa-page-subtitle">
            Every file, paste and URL becomes a <strong>document</strong>. The indexer extracts text,
            chunks it into ~800-token slices, and embeds each chunk so the AI can retrieve the most
            relevant passages.
          </p>
        </div>
      </div>

      {globalError && <div className="swa-alert swa-alert--error" style={{ marginBottom: 20 }}>{globalError}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24 }}>
        {/* ── Left: input modes ───────────────────────────────────────── */}
        <div>
          {/* Mode tabs */}
          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #E5E7EB', marginBottom: 20 }}>
            {([
              { key: 'files', icon: 'upload_file', label: 'Drop files' },
              { key: 'paste', icon: 'edit_note',   label: 'Paste text' },
              { key: 'url',   icon: 'link',        label: 'Paste URL'  },
            ] as const).map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 16px',
                  border: 'none',
                  borderBottom: mode === m.key ? '2px solid #1E1040' : '2px solid transparent',
                  background: 'transparent',
                  color: mode === m.key ? '#1E1040' : '#6B7280',
                  fontWeight: mode === m.key ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>

          {mode === 'files' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                if (e.dataTransfer.files) onFilesSelected(e.dataTransfer.files);
              }}
              style={{
                border: `2px dashed ${dragging ? '#1E1040' : '#D1D5DB'}`,
                borderRadius: 12,
                padding: '48px 24px',
                textAlign: 'center',
                background: dragging ? '#F5F3FF' : '#F9FAFB',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#1E1040', display: 'block', marginBottom: 12 }}>
                cloud_upload
              </span>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1E1040', marginBottom: 4 }}>
                Drop files here or click to select
              </div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>
                PDF · DOCX · TXT · MD · max {Math.floor(MAX_BYTES / 1024 / 1024)} MB · up to {MAX_FILES} at once
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_MIME}
                multiple
                onChange={(e) => e.target.files && onFilesSelected(e.target.files)}
                style={{ display: 'none' }}
              />

              <div
                onClick={(e) => e.stopPropagation()}
                style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
              >
                <Field label="Category for new uploads">
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="general"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Tags (comma-separated)">
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="research, mental-health"
                    style={inputStyle}
                  />
                </Field>
              </div>
            </div>
          )}

          {mode === 'paste' && (
            <form onSubmit={submitPaste} style={formStyle}>
              <Field label="Title" required>
                <input
                  value={pasteTitle}
                  onChange={(e) => setPasteTitle(e.target.value)}
                  required
                  maxLength={500}
                  placeholder="e.g. AIHW Mental Health Report 2023 — key findings"
                  style={inputStyle}
                />
              </Field>

              <Field label="Content" required>
                <textarea
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  required
                  rows={12}
                  placeholder="Paste the text you want to index. Quote + cite your source for provenance."
                  style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical', minHeight: 220 }}
                />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <Field label="Source (optional)" hint="URL or citation">
                  <input value={pasteSource} onChange={(e) => setPasteSource(e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Category">
                  <input value={pasteCategory} onChange={(e) => setPasteCategory(e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Tags">
                  <input value={pasteTags} onChange={(e) => setPasteTags(e.target.value)} style={inputStyle} placeholder="comma,separated" />
                </Field>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="submit" disabled={pasteBusy} className="swa-btn swa-btn--primary">
                  {pasteBusy ? 'Adding…' : 'Add to Vault'}
                </button>
              </div>
            </form>
          )}

          {mode === 'url' && (
            <form onSubmit={submitUrl} style={formStyle}>
              <Field label="URL" required hint="The page will be crawled with Firecrawl, cleaned, chunked and embedded.">
                <input
                  type="url"
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  placeholder="https://www.aihw.gov.au/reports/mental-health/…"
                  required
                  style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 13 }}
                />
              </Field>

              <Field label="Title (optional)" hint="Leave blank to use the page's meta title.">
                <input value={urlTitle} onChange={(e) => setUrlTitle(e.target.value)} style={inputStyle} />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Category">
                  <input value={urlCat} onChange={(e) => setUrlCat(e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Tags">
                  <input value={urlTags} onChange={(e) => setUrlTags(e.target.value)} style={inputStyle} placeholder="comma,separated" />
                </Field>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="submit" disabled={urlBusy} className="swa-btn swa-btn--primary">
                  {urlBusy ? 'Crawling…' : 'Crawl & add'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Right: queue ────────────────────────────────────────────── */}
        <aside>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1040', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Upload queue ({queue.length})
          </h3>
          {queue.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#9CA3AF', border: '1px dashed #E5E7EB', borderRadius: 12, fontSize: 13 }}>
              Uploads will appear here with live status.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {queue.map((doc) => <QueueRow key={doc.id} doc={doc} />)}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/* ─── Subcomponents ──────────────────────────────────────────────────── */

function QueueRow({ doc }: { doc: VaultDocument }) {
  return (
    <Link
      href={`/admin/vault/sources/${doc.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#1E1040' }}>
            {DOCUMENT_KIND_ICONS[doc.kind]}
          </span>
          <div style={{ fontSize: 13, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {doc.title}
          </div>
          <StatusChip status={doc.status} />
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF' }}>
          {DOCUMENT_KIND_LABELS[doc.kind]}
          {doc.chunk_count > 0 && <> · {doc.chunk_count} chunks</>}
          {doc.status_error && <> · <span style={{ color: '#B91C1C' }}>{doc.status_error}</span></>}
        </div>
      </div>
    </Link>
  );
}

export function StatusChip({ status }: { status: DocumentStatus }) {
  const m: Record<DocumentStatus, { bg: string; color: string; label: string }> = {
    pending:    { bg: '#F3F4F6', color: '#6B7280', label: 'Queued' },
    extracting: { bg: '#E0E7FF', color: '#4338CA', label: 'Extracting…' },
    chunking:   { bg: '#E0E7FF', color: '#4338CA', label: 'Chunking…' },
    embedding:  { bg: '#E0E7FF', color: '#4338CA', label: 'Embedding…' },
    ready:      { bg: '#D1FAE5', color: '#047857', label: 'Ready' },
    failed:     { bg: '#FEE2E2', color: '#B91C1C', label: 'Failed' },
  };
  const t = m[status];
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
      background: t.bg, color: t.color, textTransform: 'uppercase', letterSpacing: 0.5,
    }}>
      {t.label}
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  border: '1px solid #E5E7EB', borderRadius: 8,
  fontSize: 14, background: '#fff',
};

const formStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
  padding: 20, display: 'flex', flexDirection: 'column', gap: 14,
};

function Field({
  label, hint, required, children,
}: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}{required ? ' *' : ''}
      </span>
      {children}
      {hint && <span style={{ fontSize: 11, color: '#9CA3AF' }}>{hint}</span>}
    </label>
  );
}

function parseTags(raw: string): string[] {
  return raw.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20);
}
