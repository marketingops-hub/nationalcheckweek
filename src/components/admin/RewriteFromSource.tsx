'use client';

import { useState, useRef, useEffect } from 'react';
import { adminFetch } from '@/lib/adminFetch';

interface VaultDoc { id: string; title: string; status: string; kind: string; created_at: string }
interface RewriteResult { fields: Record<string, unknown>; document_title: string; vault_document_id: string }

interface Props {
  recordType: 'issue' | 'area';
  recordId: string | null;
  onApply: (fields: Record<string, unknown>) => void;
}

const FIELD_LABELS: Record<string, string> = {
  short_desc:      'Short Description',
  definition:      'Definition',
  australian_data: 'Australian Data',
  mechanisms:      'Mechanisms',
  anchor_stat:     'Anchor Stat',
  overview:        'Overview',
  key_stats:       'Key Stats',
  prevention:      'Prevention',
};

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pending:    { bg: '#fef9c3', color: '#854d0e', label: 'Queued' },
    extracting: { bg: '#dbeafe', color: '#1d4ed8', label: 'Extracting' },
    chunking:   { bg: '#dbeafe', color: '#1d4ed8', label: 'Chunking' },
    embedding:  { bg: '#ede9fe', color: '#6d28d9', label: 'Embedding' },
    ready:      { bg: '#dcfce7', color: '#15803d', label: 'Ready' },
    failed:     { bg: '#fee2e2', color: '#b91c1c', label: 'Failed' },
  };
  const s = map[status] ?? { bg: '#f3f4f6', color: '#4b5563', label: status };
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function FieldPreview({ fieldKey, value }: { fieldKey: string; value: unknown }) {
  const label = FIELD_LABELS[fieldKey] ?? fieldKey;
  const display = Array.isArray(value)
    ? value.map((v, i) => <div key={i} style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 2 }}>• {typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>)
    : <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{String(value ?? '')}</p>;

  const hasCitation = typeof value === 'string' && value.includes('(Source:');

  return (
    <div style={{ marginBottom: 16, padding: '12px 14px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        {hasCitation && (
          <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 99, background: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}>
            ✓ Citations included
          </span>
        )}
      </div>
      {display}
    </div>
  );
}

export default function RewriteFromSource({ recordType, recordId, onApply }: Props) {
  const [mode, setMode] = useState<'file' | 'url' | 'vault'>('file');

  // File upload
  const [file, setFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // URL ingestion
  const [url, setUrl] = useState('');
  const [urlTitle, setUrlTitle] = useState('');

  // Vault picker
  const [vaultDocs, setVaultDocs] = useState<VaultDoc[]>([]);
  const [loadingVault, setLoadingVault] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState('');

  // Shared processing state
  const [uploading, setUploading] = useState(false);
  const [pollingId, setPollingId] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<string>('');
  const [docReady, setDocReady] = useState<{ id: string; title: string } | null>(null);

  // Rewrite state
  const [rewriting, setRewriting] = useState(false);
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [error, setError] = useState('');

  // Load vault docs when switching to vault mode
  useEffect(() => {
    if (mode !== 'vault') return;
    setLoadingVault(true);
    adminFetch('/api/admin/vault/documents?status=ready&limit=100')
      .then(r => r.json())
      .then(d => setVaultDocs((d.documents ?? d.items ?? []) as VaultDoc[]))
      .catch(() => {})
      .finally(() => setLoadingVault(false));
  }, [mode]);

  // Poll vault document status until ready or failed
  useEffect(() => {
    if (!pollingId) return;
    let attempts = 0;
    const MAX = 120; // 6 minutes max
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > MAX) {
        clearInterval(interval);
        setError('Indexing timed out. Try again or pick from Vault once indexing completes.');
        setPollingId(null);
        return;
      }
      try {
        const res = await adminFetch(`/api/admin/vault/documents/${pollingId}`);
        const d = await res.json();
        const doc = d.document ?? d;
        setPollingStatus(doc.status ?? '');
        if (doc.status === 'ready') {
          clearInterval(interval);
          setPollingId(null);
          setDocReady({ id: doc.id, title: doc.title });
        } else if (doc.status === 'failed') {
          clearInterval(interval);
          setPollingId(null);
          setError(`Indexing failed: ${doc.status_error ?? 'unknown error'}`);
        }
      } catch { /* retry */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [pollingId]);

  async function handleUploadFile() {
    if (!file) return;
    setUploading(true); setError(''); setDocReady(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('title', fileTitle || file.name.replace(/\.[^.]+$/, ''));
      form.append('category', 'general');
      const res = await adminFetch('/api/admin/vault/documents', { method: 'POST', body: form });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? 'Upload failed');
      const docId = d.document?.id ?? d.id;
      if (!docId) throw new Error('No document ID returned');
      setPollingId(docId);
      setPollingStatus('pending');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleIngestUrl() {
    if (!url.trim()) return;
    setUploading(true); setError(''); setDocReady(null);
    try {
      const res = await adminFetch('/api/admin/vault/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'url', source: url.trim(), title: urlTitle.trim() || url.trim(), category: 'general', tags: [] }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? 'Ingestion failed');
      const docId = d.document?.id ?? d.id;
      if (!docId) throw new Error('No document ID returned');
      setPollingId(docId);
      setPollingStatus('pending');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'URL ingestion failed');
    } finally {
      setUploading(false);
    }
  }

  function handleSelectVaultDoc() {
    const doc = vaultDocs.find(d => d.id === selectedDocId);
    if (!doc) return;
    setDocReady({ id: doc.id, title: doc.title });
  }

  async function handleRewrite() {
    const useDoc = docReady;
    if (!useDoc || !recordId) return;
    setRewriting(true); setError(''); setResult(null);
    try {
      const res = await adminFetch('/api/admin/rewrite-from-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_type: recordType, record_id: recordId, vault_document_id: useDoc.id }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? 'Rewrite failed');
      setResult(d as RewriteResult);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Rewrite failed');
    } finally {
      setRewriting(false);
    }
  }

  function handleApply() {
    if (!result) return;
    onApply(result.fields);
  }

  function reset() {
    setFile(null); setFileTitle(''); setUrl(''); setUrlTitle('');
    setSelectedDocId(''); setDocReady(null); setPollingId(null);
    setPollingStatus(''); setResult(null); setError('');
    if (fileRef.current) fileRef.current.value = '';
  }

  const isReady = !!docReady || (mode === 'vault' && !!selectedDocId);
  const isLoading = uploading || !!pollingId || rewriting;

  return (
    <div>
      {!recordId && (
        <div className="admin-alert admin-alert-error" style={{ marginBottom: 16 }}>
          Save this record first before running an AI rewrite.
        </div>
      )}

      {/* Source mode tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {(['file', 'url', 'vault'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); reset(); }}
            className="swa-btn"
            style={{
              background: mode === m ? 'var(--color-primary)' : 'var(--color-surface)',
              color: mode === m ? '#fff' : 'var(--color-text)',
              border: '1px solid var(--color-border)',
              fontWeight: mode === m ? 600 : 400,
            }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              {m === 'file' ? 'upload_file' : m === 'url' ? 'link' : 'folder_open'}
            </span>
            {m === 'file' ? 'Upload Document' : m === 'url' ? 'From URL' : 'From Vault'}
          </button>
        ))}
      </div>

      {/* File upload panel */}
      {mode === 'file' && !docReady && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label className="swa-label" style={{ marginBottom: 4, display: 'block' }}>Document title <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional — defaults to filename)</span></label>
            <input className="swa-form-input" value={fileTitle} onChange={e => setFileTitle(e.target.value)} placeholder="e.g. APS Mental Health Report 2024" />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <span className="swa-btn swa-btn--secondary">
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>attach_file</span>
              {file ? file.name : 'Choose file'}
            </span>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt,.md" onChange={e => setFile(e.target.files?.[0] ?? null)} style={{ display: 'none' }} />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>PDF, DOCX, TXT, MD — max 100 MB</span>
          </label>
          <div>
            <button className="swa-btn swa-btn--primary" onClick={handleUploadFile} disabled={!file || isLoading}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>cloud_upload</span>
              Upload to Vault &amp; Index
            </button>
          </div>
        </div>
      )}

      {/* URL panel */}
      {mode === 'url' && !docReady && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label className="swa-label" style={{ marginBottom: 4, display: 'block' }}>URL</label>
            <input className="swa-form-input" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.aihw.gov.au/reports/…" />
          </div>
          <div>
            <label className="swa-label" style={{ marginBottom: 4, display: 'block' }}>Document title <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(used for citations — be specific)</span></label>
            <input className="swa-form-input" value={urlTitle} onChange={e => setUrlTitle(e.target.value)} placeholder="e.g. AIHW Mental Health Report 2024" />
          </div>
          <div>
            <button className="swa-btn swa-btn--primary" onClick={handleIngestUrl} disabled={!url.trim() || isLoading}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>download</span>
              Fetch &amp; Index URL
            </button>
          </div>
        </div>
      )}

      {/* Vault picker */}
      {mode === 'vault' && !docReady && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loadingVault ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Loading vault…</p>
          ) : (
            <>
              <div>
                <label className="swa-label" style={{ marginBottom: 4, display: 'block' }}>Select a document from the Vault</label>
                <select className="swa-form-input" value={selectedDocId} onChange={e => setSelectedDocId(e.target.value)}>
                  <option value="">— choose a document —</option>
                  {vaultDocs.map(d => (
                    <option key={d.id} value={d.id}>{d.title} ({d.kind})</option>
                  ))}
                </select>
              </div>
              <div>
                <button className="swa-btn swa-btn--primary" onClick={handleSelectVaultDoc} disabled={!selectedDocId}>
                  Use this document
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Polling status */}
      {!!pollingId && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, marginTop: 16 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#1d4ed8', animation: 'spin 1s linear infinite' }}>refresh</span>
          <span style={{ fontSize: 13, color: '#1d4ed8' }}>
            Indexing document… <StatusChip status={pollingStatus} /> — this usually takes 20–60 seconds
          </span>
        </div>
      )}

      {/* Document ready — rewrite button */}
      {docReady && !result && (
        <div style={{ padding: '14px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, verticalAlign: 'middle', marginRight: 4 }}>check_circle</span>
                Ready: <em style={{ fontWeight: 400 }}>{docReady.title}</em>
              </div>
              <div style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>
                The document is indexed in the Vault and will be cited in rewrites.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="swa-btn swa-btn--secondary" onClick={reset} disabled={rewriting}>Change</button>
              <button className="swa-btn swa-btn--primary" onClick={handleRewrite} disabled={rewriting || !recordId}>
                {rewriting
                  ? <><span className="material-symbols-outlined" style={{ fontSize: 15, animation: 'spin 1s linear infinite' }}>refresh</span> Rewriting…</>
                  : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>auto_awesome</span> Generate Rewrite</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="admin-alert admin-alert-error" style={{ marginTop: 12 }}>{error}</div>
      )}

      {/* Results preview */}
      {result && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 600 }}>Rewrite preview</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                Based on: <strong>{result.document_title}</strong> — review each field, then apply.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="swa-btn swa-btn--secondary" onClick={reset}>Start over</button>
              <button className="swa-btn swa-btn--primary" onClick={handleApply}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>check</span>
                Apply to form
              </button>
            </div>
          </div>

          {Object.entries(result.fields).map(([key, value]) => (
            <FieldPreview key={key} fieldKey={key} value={value} />
          ))}

          <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>info</span>
            Applying will fill in the form fields — you still need to review and save the record.
          </div>
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
