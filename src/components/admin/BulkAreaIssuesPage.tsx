'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/adminFetch';

interface Area { id: string; name: string; state: string; slug: string; issues: unknown }
type LogLevel = 'info' | 'ok' | 'warn' | 'error';
interface LogEntry { areaName: string; msg: string; level: LogLevel }

const LEVEL_COLOR: Record<LogLevel, string> = {
  info:  '#6b7280',
  ok:    '#16a34a',
  warn:  '#d97706',
  error: '#dc2626',
};

export default function BulkAreaIssuesPage() {
  /* ── Step 1: Source URL ── */
  const [url, setUrl]           = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [ingesting, setIngesting] = useState(false);
  const [pollingId, setPollingId] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState('');
  const [docReady, setDocReady] = useState<{ id: string; title: string } | null>(null);
  const [urlError, setUrlError] = useState('');

  /* ── Step 2: Area selection ── */
  const [areas, setAreas]         = useState<Area[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [stateFilter, setStateFilter]   = useState('all');
  const [selected, setSelected]         = useState<Set<string>>(new Set());

  /* ── Step 3: Run ── */
  const [running, setRunning]   = useState(false);
  const [log, setLog]           = useState<LogEntry[]>([]);
  const [done, setDone]         = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Load areas
  useEffect(() => {
    setLoadingAreas(true);
    adminFetch('/api/admin/areas')
      .then(r => r.json())
      .then(d => setAreas(d.areas ?? []))
      .catch(() => {})
      .finally(() => setLoadingAreas(false));
  }, []);

  // Poll vault doc status
  useEffect(() => {
    if (!pollingId) return;
    let attempts = 0;
    const id = setInterval(async () => {
      attempts++;
      if (attempts > 120) {
        clearInterval(id);
        setUrlError('Indexing timed out. Try again.');
        setPollingId(null);
        return;
      }
      try {
        const res = await adminFetch(`/api/admin/vault/documents/${pollingId}`);
        const d = await res.json();
        const doc = d.document ?? d;
        setPollingStatus(doc.status ?? '');
        if (doc.status === 'ready') {
          clearInterval(id);
          setPollingId(null);
          setDocReady({ id: doc.id, title: doc.title });
        } else if (doc.status === 'failed') {
          clearInterval(id);
          setPollingId(null);
          setUrlError(`Indexing failed: ${doc.status_error ?? 'unknown'}`);
        }
      } catch { /* retry */ }
    }, 3000);
    return () => clearInterval(id);
  }, [pollingId]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  async function handleIngest() {
    if (!url.trim()) return;
    setIngesting(true); setUrlError(''); setDocReady(null);
    try {
      const res = await adminFetch('/api/admin/vault/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'url', url: url.trim(), title: urlTitle.trim() || undefined, category: 'general', tags: [] }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? 'Failed');
      const docId = d.document?.id ?? d.id;
      if (!docId) throw new Error('No document ID returned');
      setPollingId(docId);
      setPollingStatus('pending');
    } catch (e) {
      setUrlError(e instanceof Error ? e.message : 'Failed to ingest URL');
    } finally {
      setIngesting(false);
    }
  }

  const states = ['all', ...Array.from(new Set(areas.map(a => a.state))).sort()];
  const filteredAreas = stateFilter === 'all' ? areas : areas.filter(a => a.state === stateFilter);
  function parseIssues(raw: unknown): unknown[] {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') { try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; } }
    return [];
  }
  const areasWithIssues = filteredAreas.filter(a => parseIssues(a.issues).length > 0);

  function toggleArea(id: string) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function selectAll() { setSelected(new Set(filteredAreas.map(a => a.id))); }
  function selectWithIssues() { setSelected(new Set(areasWithIssues.map(a => a.id))); }
  function clearAll() { setSelected(new Set()); }

  function addLog(areaName: string, msg: string, level: LogLevel) {
    setLog(l => [...l, { areaName, msg, level }]);
  }

  async function handleRun() {
    if (!docReady || selected.size === 0) return;
    setRunning(true); setLog([]); setDone(false);

    const queue = areas.filter(a => selected.has(a.id));
    addLog('', `Starting bulk rewrite for ${queue.length} areas using "${docReady.title}"…`, 'info');

    let ok = 0, skipped = 0, failed = 0;

    for (const area of queue) {
      const hasIssues = parseIssues(area.issues).length > 0;
      if (!hasIssues) {
        addLog(area.name, 'Skipped — no local issues configured', 'warn');
        skipped++;
        continue;
      }

      addLog(area.name, 'Rewriting…', 'info');
      try {
        const res = await adminFetch('/api/admin/areas/rewrite-issues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ area_id: area.id, vault_document_id: docReady.id, save: true }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? 'Failed');
        addLog(area.name, `✓ Updated ${(d.issues as unknown[]).length} issues — saved`, 'ok');
        ok++;
      } catch (e) {
        addLog(area.name, `✗ ${e instanceof Error ? e.message : 'Error'}`, 'error');
        failed++;
      }
    }

    addLog('', `Done — ${ok} updated · ${skipped} skipped · ${failed} failed`, ok > 0 ? 'ok' : 'warn');
    setRunning(false);
    setDone(true);
  }

  const step = !docReady ? 1 : !done ? 2 : 3;

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Bulk Generate Local Issues from URL</h1>
          <p className="swa-page-subtitle">Paste a source URL — AI rewrites the local issues for every selected area using that page as a reference.</p>
        </div>
        <Link href="/admin/content" className="swa-btn swa-btn--secondary" style={{ textDecoration: 'none' }}>
          ← Back to Areas
        </Link>
      </div>

      {/* ── Step 1: URL ── */}
      <div style={{ marginBottom: 24, padding: '20px 22px', background: step === 1 ? '#f5f3ff' : 'var(--color-surface)', border: `1px solid ${step === 1 ? '#c4b5fd' : 'var(--color-border)'}`, borderRadius: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ width: 26, height: 26, borderRadius: '50%', background: docReady ? '#16a34a' : '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
            {docReady ? '✓' : '1'}
          </span>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Source URL</span>
          {docReady && <span style={{ fontSize: 12, color: '#16a34a', marginLeft: 4 }}>— <em>{docReady.title}</em> ready</span>}
        </div>

        {!docReady && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                className="swa-form-input"
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://www.aihw.gov.au/…"
                style={{ flex: '1 1 320px' }}
              />
              <input
                className="swa-form-input"
                value={urlTitle}
                onChange={e => setUrlTitle(e.target.value)}
                placeholder="Document title (used in citations)"
                style={{ flex: '1 1 240px' }}
              />
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: -4 }}>
              The title is used when citing stats — be specific, e.g. "AIHW Young Australians Report 2024"
            </p>
            {pollingId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#7c3aed' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>refresh</span>
                Indexing… <span style={{ padding: '1px 8px', borderRadius: 99, background: '#ede9fe', fontSize: 11, fontWeight: 600 }}>{pollingStatus}</span>
              </div>
            )}
            {urlError && <p style={{ fontSize: 12, color: '#dc2626' }}>{urlError}</p>}
            <div>
              <button
                className="swa-btn swa-btn--primary"
                onClick={handleIngest}
                disabled={!url.trim() || ingesting || !!pollingId}
              >
                {ingesting ? 'Fetching…' : pollingId ? 'Indexing…' : 'Fetch & Index URL'}
              </button>
            </div>
          </div>
        )}

        {docReady && !done && (
          <button className="swa-btn swa-btn--secondary" onClick={() => { setDocReady(null); setUrl(''); setUrlTitle(''); setSelected(new Set()); }}>
            Change source
          </button>
        )}
      </div>

      {/* ── Step 2: Area selection ── */}
      {docReady && (
        <div style={{ marginBottom: 24, padding: '20px 22px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>2</span>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Select Areas</span>
            {selected.size > 0 && <span style={{ fontSize: 12, background: '#7c3aed', color: '#fff', padding: '2px 10px', borderRadius: 99, fontWeight: 700 }}>{selected.size} selected</span>}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="swa-form-input" value={stateFilter} onChange={e => { setStateFilter(e.target.value); setSelected(new Set()); }} style={{ width: 'auto', minWidth: 180 }}>
              {states.map(s => <option key={s} value={s}>{s === 'all' ? 'All states' : s}</option>)}
            </select>
            <button className="swa-btn swa-btn--ghost" onClick={selectAll} style={{ fontSize: 12 }}>Select all ({filteredAreas.length})</button>
            <button className="swa-btn swa-btn--ghost" onClick={selectWithIssues} style={{ fontSize: 12 }}>With issues only ({areasWithIssues.length})</button>
            <button className="swa-btn swa-btn--ghost" onClick={clearAll} style={{ fontSize: 12 }}>Clear</button>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
              {loadingAreas ? 'Loading…' : `${filteredAreas.length} areas`}
            </span>
          </div>

          <div style={{ maxHeight: 340, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 8 }}>
            <table className="swa-table" style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input type="checkbox"
                      checked={filteredAreas.length > 0 && filteredAreas.every(a => selected.has(a.id))}
                      onChange={e => e.target.checked ? selectAll() : clearAll()}
                    />
                  </th>
                  <th>Area</th>
                  <th>State</th>
                  <th>Local Issues</th>
                </tr>
              </thead>
              <tbody>
                {filteredAreas.map(area => {
                  const issueCount = Array.isArray(area.issues) ? area.issues.length : 0;
                  return (
                    <tr key={area.id} style={selected.has(area.id) ? { background: '#f5f3ff' } : {}} onClick={() => toggleArea(area.id)} className="swa-table__row--clickable">
                      <td onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(area.id)} onChange={() => toggleArea(area.id)} />
                      </td>
                      <td style={{ fontWeight: 500 }}>{area.name}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{area.state}</td>
                      <td>
                        {issueCount === 0
                          ? <span style={{ color: '#9ca3af', fontSize: 11 }}>none — will skip</span>
                          : <span style={{ color: '#7c3aed', fontWeight: 600 }}>{issueCount} issue{issueCount !== 1 ? 's' : ''}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 14, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13, verticalAlign: 'middle', marginRight: 4 }}>warning</span>
            This will <strong>auto-save</strong> rewritten issues directly to the database for each area. Areas with no local issues configured will be skipped.
          </div>

          <div style={{ marginTop: 14 }}>
            <button
              className="swa-btn swa-btn--primary"
              onClick={handleRun}
              disabled={running || selected.size === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {running
                ? <><span className="material-symbols-outlined" style={{ fontSize: 15, animation: 'spin 1s linear infinite' }}>refresh</span> Running…</>
                : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>auto_awesome</span> Generate for {selected.size} area{selected.size !== 1 ? 's' : ''}</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Progress log ── */}
      {log.length > 0 && (
        <div style={{ padding: '16px 18px', background: '#0f172a', borderRadius: 10, border: '1px solid #1e293b' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Progress log</div>
          <div ref={logRef} style={{ maxHeight: 340, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12 }}>
            {log.map((entry, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 3 }}>
                <span style={{ color: '#475569', flexShrink: 0, fontSize: 11 }}>{String(i + 1).padStart(3, '0')}</span>
                {entry.areaName && <span style={{ color: '#7c3aed', flexShrink: 0, minWidth: 180 }}>{entry.areaName}</span>}
                <span style={{ color: LEVEL_COLOR[entry.level] }}>{entry.msg}</span>
              </div>
            ))}
          </div>

          {done && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <Link href="/admin/content" className="swa-btn swa-btn--primary" style={{ textDecoration: 'none', fontSize: 13 }}>
                View Areas
              </Link>
              <button className="swa-btn swa-btn--secondary" style={{ fontSize: 13 }} onClick={() => { setDone(false); setLog([]); setSelected(new Set()); }}>
                Run again
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
