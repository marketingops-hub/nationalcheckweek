'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/adminFetch';

const PAGE_SIZE = 15;

interface Faq {
  id: string;
  question: string;
  answer: string;
  category?: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

type FormData = {
  question: string; answer: string; category: string;
  sortOrder: number; active: boolean;
};

const emptyForm: FormData = {
  question: '', answer: '', category: '', sortOrder: 0, active: true,
};

function FaqForm({ initial, onSave, onCancel, saving }: {
  initial: FormData; onSave: (d: FormData) => void; onCancel: () => void; saving: boolean;
}) {
  const [form, setForm] = useState<FormData>(initial);
  const set = (k: keyof FormData, v: string | number | boolean) =>
    setForm(p => ({ ...p, [k]: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label className="swa-form-label">Question *</label>
        <input className="swa-form-input" value={form.question} onChange={e => set('question', e.target.value)} placeholder="What is National Check-in Week?" />
      </div>
      <div>
        <label className="swa-form-label">Answer *</label>
        <textarea className="swa-form-textarea" rows={5} value={form.answer} onChange={e => set('answer', e.target.value)} placeholder="Write the answer..." />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div>
          <label className="swa-form-label">Category</label>
          <input className="swa-form-input" value={form.category} onChange={e => set('category', e.target.value)} placeholder="General" />
        </div>
        <div>
          <label className="swa-form-label">Sort Order</label>
          <input type="number" className="swa-form-input" value={form.sortOrder} onChange={e => set('sortOrder', parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <label className="swa-form-label">Status</label>
          <button type="button" onClick={() => set('active', !form.active)}
            className={`swa-toggle ${form.active ? 'on' : ''}`} style={{ marginRight: 8 }} />
          <span style={{ fontSize: 13, color: form.active ? 'var(--color-success)' : 'var(--color-text-faint)', fontWeight: 500 }}>
            {form.active ? 'Active' : 'Hidden'}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
        <button onClick={() => onSave(form)} disabled={saving || !form.question || !form.answer}
          className="swa-btn swa-btn--primary" style={{ opacity: saving || !form.question || !form.answer ? 0.5 : 1 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{saving ? 'hourglass_empty' : 'save'}</span>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} className="swa-btn" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)' }}>Cancel</button>
      </div>
    </div>
  );
}

export default function FaqClient() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);

  const categories = useMemo(() =>
    ['all', ...Array.from(new Set(faqs.map(f => f.category ?? 'General'))).sort()]
  , [faqs]);

  const filtered = useMemo(() => faqs.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
    const matchCat = categoryFilter === 'all' || (f.category ?? 'General') === categoryFilter;
    return matchSearch && matchCat;
  }), [faqs, search, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fetchAll = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/faq?all=true');
      const d = await res.json();
      setFaqs(d.faqs ?? []);
    } catch { setError('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (form: FormData) => {
    setCreating(true); setError(null);
    try {
      const res = await adminFetch('/api/admin/faq', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Create failed');
      setFaqs(prev => [d.faq, ...prev]);
      setShowCreate(false);
    } catch (err) { setError(err instanceof Error ? err.message : 'Create failed'); }
    finally { setCreating(false); }
  };

  const handleUpdate = async (id: string, patch: Partial<Faq> | FormData) => {
    setUpdatingId(id);
    try {
      const res = await adminFetch(`/api/admin/faq/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Update failed');
      setFaqs(prev => prev.map(f => f.id === id ? d.faq : f));
      setEditId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string, question: string) => {
    if (!confirm(`Delete "${question}"?`)) return;
    const res = await adminFetch(`/api/admin/faq/${id}`, { method: 'DELETE' });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Delete failed'); }
    setFaqs(prev => prev.filter(f => f.id !== id));
  };

  const toggleActive = async (f: Faq) => {
    try { await handleUpdate(f.id, { active: !f.active }); } catch (err) { setError(err instanceof Error ? err.message : 'Toggle failed'); }
  };

  return (
    <>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">FAQ</h1>
          <p className="swa-page-subtitle">Manage frequently asked questions · {faqs.length > 0 ? `${faqs.length} total, ${faqs.filter(f => f.active).length} active` : 'loading…'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/faq" className="swa-btn" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)', textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>open_in_new</span> View Page
          </Link>
          <button onClick={() => setShowCreate(true)} className="swa-btn swa-btn--primary">
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span> Add FAQ
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--color-error)', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}

      {!loading && faqs.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 17, color: '#9CA3AF', pointerEvents: 'none' }}>search</span>
            <input type="search" placeholder="Search FAQs…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="swa-form-input" style={{ paddingLeft: 36 }} />
          </div>
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            className="swa-form-input" style={{ width: 'auto', minWidth: 160 }}>
            {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>)}
          </select>
          <span style={{ fontSize: 12, color: 'var(--color-text-faint)', marginLeft: 'auto' }}>
            {filtered.length} of {faqs.length}
          </span>
        </div>
      )}

      {showCreate && (
        <div className="swa-card" style={{ marginBottom: 20, borderColor: 'var(--color-primary-light)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-primary)' }}>New FAQ</div>
          <FaqForm initial={emptyForm} onSave={d => handleCreate(d)} onCancel={() => setShowCreate(false)} saving={creating} />
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-faint)' }}>Loading...</div>}

      {!loading && faqs.length === 0 && !showCreate && (
        <div className="swa-card" style={{ textAlign: 'center', padding: 48 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-text-faint)', display: 'block', marginBottom: 8 }}>help</span>
          <p style={{ color: 'var(--color-text-faint)', margin: 0 }}>No FAQs yet. Click &quot;Add FAQ&quot; to create one.</p>
        </div>
      )}

      {!loading && faqs.length > 0 && (
        <div className="swa-card" style={{ padding: 0 }}>
          <table className="swa-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Question</th>
                <th style={{ width: 100 }}>Category</th>
                <th style={{ width: 60 }}>Order</th>
                <th style={{ width: 80 }}>Status</th>
                <th style={{ width: 100, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-faint)' }}>No FAQs match your search.</td></tr>
              )}
              {paginated.map(f => (
                <React.Fragment key={f.id}>
                  <tr style={{ opacity: f.active ? 1 : 0.5 }}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{f.question}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-faint)', marginTop: 2, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{f.answer}</div>
                    </td>
                    <td><span className="swa-badge swa-badge--info">{f.category || 'General'}</span></td>
                    <td style={{ textAlign: 'center' }}><span className="swa-badge swa-badge--primary">#{f.sortOrder}</span></td>
                    <td>
                      <button onClick={() => toggleActive(f)} className={`swa-badge ${f.active ? 'swa-badge--success' : ''}`}
                        style={{ cursor: 'pointer', border: 'none', background: f.active ? undefined : 'rgba(156,163,175,0.1)', color: f.active ? undefined : 'var(--color-text-faint)' }}>
                        {f.active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button onClick={() => setEditId(editId === f.id ? null : f.id)} className="swa-btn-ghost" title="Edit"
                          style={{ padding: 4, color: editId === f.id ? 'var(--color-primary)' : undefined }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{editId === f.id ? 'expand_less' : 'edit'}</span>
                        </button>
                        <button onClick={async () => {
                          try { await handleDelete(f.id, f.question); }
                          catch (err) { setError(err instanceof Error ? err.message : 'Delete failed'); }
                        }} className="swa-btn-ghost" title="Delete" style={{ padding: 4, color: 'var(--color-error)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editId === f.id && (
                    <tr>
                      <td colSpan={5} style={{ padding: '0 0 8px 0', background: '#FAFAFA', borderTop: 'none' }}>
                        <div style={{ padding: '16px 20px', borderLeft: '3px solid var(--color-primary)', margin: '0 4px 4px' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--color-text-primary)' }}>Edit FAQ</div>
                          <FaqForm
                            initial={{ question: f.question, answer: f.answer, category: f.category ?? '', sortOrder: f.sortOrder, active: f.active }}
                            onSave={d => handleUpdate(f.id, d)}
                            onCancel={() => setEditId(null)}
                            saving={updatingId === f.id}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && faqs.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-faint)', display: 'flex', gap: 16 }}>
            <span>{faqs.length} total</span>
            <span>{faqs.filter(f => f.active).length} active</span>
            <span>{faqs.filter(f => !f.active).length} hidden</span>
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="swa-icon-btn" style={{ opacity: page === 1 ? 0.4 : 1 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
              </button>
              <span style={{ fontSize: 12, color: 'var(--color-text-faint)', minWidth: 60, textAlign: 'center' }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="swa-icon-btn" style={{ opacity: page === totalPages ? 0.4 : 1 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
