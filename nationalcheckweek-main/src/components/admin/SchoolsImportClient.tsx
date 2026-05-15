'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface ImportResult {
  total: number;
  inserted: number;
  errors?: string[];
}

export default function SchoolsImportClient() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  function handleFile(f: File | null) {
    if (!f) return;
    if (!f.name.endsWith('.csv')) {
      setError('Please upload a .csv file.');
      return;
    }
    setFile(f);
    setError('');
    setResult(null);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError('');
    setResult(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/schools/import', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Upload failed');
      setResult(json);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720 }}>

      {/* Expected format info */}
      <div className="swa-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-primary)' }}>info</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Expected CSV Format</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>
          Upload a standard ACARA School Profile CSV. Records are matched and upserted by <strong>ACARA SML ID</strong> — existing schools will be updated, new ones added.
        </p>
        <div style={{ fontSize: 12, color: 'var(--color-text-faint)', background: 'var(--color-bg, #f9f9fb)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontFamily: 'monospace', lineHeight: 1.8, overflowX: 'auto', whiteSpace: 'nowrap' }}>
          Calendar Year, ACARA SML ID, School Name, Suburb, State, Postcode, School Sector, School Type, School URL, Governing Body, Governing Body URL, Year Range, Geolocation, ICSEA, ICSEA Percentile, Bottom SEA Quarter (%), ...
        </div>
      </div>

      {/* Drop zone */}
      <div className="swa-card" style={{ padding: 0 }}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files[0] ?? null);
          }}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--color-primary)' : file ? 'var(--color-success, #16a34a)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '48px 32px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? 'var(--color-primary-light)' : file ? '#f0fdf4' : 'transparent',
            transition: 'all 0.15s ease',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 48,
              color: file ? 'var(--color-success, #16a34a)' : 'var(--color-text-faint)',
              display: 'block',
              marginBottom: 12,
            }}
          >
            {file ? 'check_circle' : 'upload_file'}
          </span>

          {file ? (
            <>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                {file.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB · Click to change
              </div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)', marginBottom: 6 }}>
                Drop CSV file here or click to browse
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>
                Supports .csv files up to 50 MB
              </div>
            </>
          )}

          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="swa-alert swa-alert--error">{error}</div>
      )}

      {/* Result */}
      {result && (
        <div className="swa-card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#16a34a' }}>check_circle</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#15803d' }}>Import Complete</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: result.errors ? 16 : 0 }}>
            {[
              { label: 'Total rows', value: result.total.toLocaleString() },
              { label: 'Upserted', value: result.inserted.toLocaleString() },
              { label: 'Errors', value: (result.errors?.length ?? 0).toString() },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center', padding: '12px', background: '#fff', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#15803d' }}>{value}</div>
                <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
          {result.errors && result.errors.length > 0 && (
            <div style={{ fontSize: 12, color: '#dc2626', background: '#fff1f1', border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginTop: 8 }}>
              <strong>Batch errors:</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 16 }}>
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="swa-btn swa-btn--primary"
          style={{
            padding: '10px 28px',
            fontSize: 14,
            cursor: (!file || uploading) ? 'not-allowed' : 'pointer',
            opacity: (!file || uploading) ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {uploading ? (
            <>
              <span className="material-symbols-outlined swa-spin" style={{ fontSize: 16 }}>refresh</span>
              Importing…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span>
              Upload &amp; Import
            </>
          )}
        </button>

        {file && !uploading && (
          <button
            onClick={() => { setFile(null); setResult(null); setError(''); if (fileRef.current) fileRef.current.value = ''; }}
            style={{
              padding: '10px 16px',
              fontSize: 13,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
              background: 'var(--color-card)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Clear
          </button>
        )}
      </div>

      <style>{`.swa-spin { animation: swa-spin 1s linear infinite; } @keyframes swa-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
