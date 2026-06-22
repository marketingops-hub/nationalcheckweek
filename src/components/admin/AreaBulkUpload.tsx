'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/adminFetch';

interface ParsedRow {
  name: string;
  state: string;
  state_slug: string;
  type: string;
  slug: string;
  population: string;
  schools: string;
  _error?: string;
}

interface ResultRow { name: string; ok: boolean; error?: string }

const REQUIRED_COLS = ['name', 'state', 'state_slug'];
const ALL_COLS = ['name', 'state', 'state_slug', 'type', 'slug', 'population', 'schools'];
const TEMPLATE_CSV = `name,state,state_slug,type,slug,population,schools
Parramatta,New South Wales,new-south-wales,city,,242000,84
Geelong,Victoria,victoria,city,,280000,62
Townsville,Queensland,queensland,city,,180000,51
`;

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    // basic CSV split (handles quoted fields)
    const cells: string[] = [];
    let cur = '';
    let inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ',' && !inQuote) { cells.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    cells.push(cur.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cells[i] ?? ''; });

    const missing = REQUIRED_COLS.filter(c => !row[c]);
    return {
      name:       row.name       ?? '',
      state:      row.state      ?? '',
      state_slug: row.state_slug ?? '',
      type:       row.type       || 'city',
      slug:       row.slug       ?? '',
      population: row.population ?? '',
      schools:    row.schools    ?? '',
      _error: missing.length ? `Missing: ${missing.join(', ')}` : undefined,
    };
  });
}

const TYPE_COLORS: Record<string, string> = {
  city:   '#0ea5e9',
  region: '#8b5cf6',
  lga:    '#f59e0b',
};

export default function AreaBulkUpload() {
  const [csvText, setCsvText]     = useState('');
  const [rows, setRows]           = useState<ParsedRow[]>([]);
  const [parsed, setParsed]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults]     = useState<ResultRow[] | null>(null);
  const [submitError, setSubmitError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleParse() {
    const r = parseCSV(csvText);
    setRows(r);
    setParsed(true);
    setResults(null);
    setSubmitError('');
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      const r = parseCSV(text);
      setRows(r);
      setParsed(true);
      setResults(null);
    };
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'suburbs-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSubmit() {
    const validRows = rows.filter(r => !r._error);
    if (!validRows.length) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await adminFetch('/api/admin/areas/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      setResults(data.results);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setCsvText('');
    setRows([]);
    setParsed(false);
    setResults(null);
    setSubmitError('');
    if (fileRef.current) fileRef.current.value = '';
  }

  const validCount   = rows.filter(r => !r._error).length;
  const invalidCount = rows.filter(r => !!r._error).length;

  if (results) {
    const ok  = results.filter(r => r.ok);
    const bad = results.filter(r => !r.ok);
    return (
      <div>
        <div className="swa-page-header">
          <div>
            <h1 className="swa-page-title">Bulk Upload — Done</h1>
            <p className="swa-page-subtitle">{ok.length} added · {bad.length} failed</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="swa-btn swa-btn--secondary" onClick={handleReset}>Upload More</button>
            <Link href="/admin/content" className="swa-btn swa-btn--primary" style={{ textDecoration: 'none' }}>
              Back to Areas
            </Link>
          </div>
        </div>

        {ok.length > 0 && (
          <div className="admin-alert admin-alert-success" style={{ marginBottom: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 6 }}>check_circle</span>
            {ok.length} suburb{ok.length !== 1 ? 's' : ''} added successfully.
          </div>
        )}
        {bad.length > 0 && (
          <div className="admin-alert admin-alert-error" style={{ marginBottom: 16 }}>
            <strong>{bad.length} row{bad.length !== 1 ? 's' : ''} failed:</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
              {bad.map((r, i) => <li key={i}><strong>{r.name}</strong> — {r.error}</li>)}
            </ul>
          </div>
        )}

        <table className="swa-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i}>
                <td>{r.name}</td>
                <td>
                  {r.ok
                    ? <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Added</span>
                    : <span style={{ color: '#dc2626' }}>✗ {r.error}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Bulk Upload Suburbs</h1>
          <p className="swa-page-subtitle">Upload a CSV to add multiple areas at once</p>
        </div>
        <Link href="/admin/content" className="swa-btn swa-btn--secondary" style={{ textDecoration: 'none' }}>
          ← Back to Areas
        </Link>
      </div>

      {/* Instructions */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: '0 0 8px', fontWeight: 600 }}>CSV format</p>
            <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--color-text-muted)' }}>
              Required columns: <code>name</code>, <code>state</code>, <code>state_slug</code>
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
              Optional: <code>type</code> (city/region/lga, default city), <code>slug</code> (auto-generated if blank), <code>population</code>, <code>schools</code>
            </p>
          </div>
          <button className="swa-btn swa-btn--secondary" onClick={downloadTemplate} style={{ flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
            Download template
          </button>
        </div>
      </div>

      {/* Input area */}
      {!parsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* File upload */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <span className="swa-btn swa-btn--secondary">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload_file</span>
              Choose CSV file
            </span>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              style={{ display: 'none' }}
            />
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>or paste below</span>
          </label>

          <textarea
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder={`name,state,state_slug,type\nParramatta,New South Wales,new-south-wales,city`}
            rows={10}
            className="swa-form-input"
            style={{ fontFamily: 'monospace', fontSize: 13, resize: 'vertical' }}
          />

          <div>
            <button
              className="swa-btn swa-btn--primary"
              onClick={handleParse}
              disabled={!csvText.trim()}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>table_view</span>
              Preview {csvText.trim() ? '' : '(paste CSV first)'}
            </button>
          </div>
        </div>
      )}

      {/* Preview table */}
      {parsed && rows.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
              <strong style={{ color: '#16a34a' }}>{validCount} valid</strong>
              {invalidCount > 0 && <> · <strong style={{ color: '#dc2626' }}>{invalidCount} invalid</strong></>}
            </span>
            <button className="swa-btn swa-btn--secondary" onClick={handleReset} style={{ marginLeft: 'auto' }}>
              Start over
            </button>
          </div>

          {submitError && (
            <div className="admin-alert admin-alert-error" style={{ marginBottom: 12 }}>{submitError}</div>
          )}

          <div style={{ overflowX: 'auto', marginBottom: 16 }}>
            <table className="swa-table" style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr>
                  {ALL_COLS.map(c => <th key={c}>{c}</th>)}
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} style={row._error ? { background: '#fef2f2' } : {}}>
                    <td style={{ fontWeight: 600 }}>{row.name || <em style={{ color: '#9ca3af' }}>empty</em>}</td>
                    <td>{row.state}</td>
                    <td><code style={{ fontSize: 12 }}>{row.state_slug}</code></td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 12,
                        fontSize: 11, fontWeight: 600, color: '#fff',
                        background: TYPE_COLORS[row.type] ?? '#6b7280',
                      }}>
                        {row.type || 'city'}
                      </span>
                    </td>
                    <td><code style={{ fontSize: 12 }}>{row.slug || <em style={{ color: '#9ca3af' }}>auto</em>}</code></td>
                    <td>{row.population}</td>
                    <td>{row.schools}</td>
                    <td>
                      {row._error
                        ? <span style={{ color: '#dc2626', fontSize: 12 }}>✗ {row._error}</span>
                        : <span style={{ color: '#16a34a' }}>✓ Ready</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {validCount > 0 && (
            <button
              className="swa-btn swa-btn--primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? <><span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>refresh</span> Uploading…</>
                : <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>cloud_upload</span> Upload {validCount} suburb{validCount !== 1 ? 's' : ''}</>}
            </button>
          )}
        </div>
      )}

      {parsed && rows.length === 0 && (
        <div className="admin-alert admin-alert-error">
          No rows found. Make sure your CSV has a header row and at least one data row.
        </div>
      )}
    </div>
  );
}
