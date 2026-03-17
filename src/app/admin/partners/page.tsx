'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const PAGE_SIZE = 15;

interface Partner {
  id: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  url?: string | null;
  slug: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

type FormData = {
  name: string; description: string; logoUrl: string; url: string;
  slug: string; sortOrder: number; active: boolean;
};

const emptyForm: FormData = {
  name: '', description: '', logoUrl: '', url: '', slug: '', sortOrder: 0, active: true,
};

function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

function PartnerForm({ initial, onSave, onCancel, saving }: {
  initial: FormData; onSave: (d: FormData) => void; onCancel: () => void; saving: boolean;
}) {
  const [form, setForm] = useState<FormData>(initial);
  const [autoSlug, setAutoSlug] = useState(!initial.name);
  const set = (k: keyof FormData, v: string | number | boolean) =>
    setForm(p => { const n = { ...p, [k]: v }; if (k === 'name' && autoSlug) n.slug = slugify(v as string); return n; });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label className="swa-form-label">Partner Name *</label>
          <input className="swa-form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Acme Corp" />
        </div>
        <div>
          <label className="swa-form-label">URL Slug * {autoSlug && <span style={{ color: 'var(--color-text-faint)', fontWeight: 400 }}>(auto)</span>}</label>
          <input className="swa-form-input" value={form.slug} onChange={e => { setAutoSlug(false); set('slug', e.target.value); }} placeholder="acme-corp" />
          <span style={{ fontSize: 10, color: 'var(--color-text-faint)' }}>/partners/{form.slug || '...'}</span>
        </div>
      </div>
      <div>
        <label className="swa-form-label">Description</label>
        <textarea className="swa-form-textarea" rows={4} value={form.description} onChange={e => set('description', e.target.value)} placeholder="About this partner..." />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label className="swa-form-label">Logo URL</label>
          <input className="swa-form-input" value={form.logoUrl} onChange={e => set('logoUrl', e.target.value)} placeholder="https://example.com/logo.png" />
          {form.logoUrl && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)', background: 'var(--color-bg)', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Image src={form.logoUrl} alt="Preview" width={28} height={28} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} unoptimized />
              </div>
              <span style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>Preview</span>
            </div>
          )}
        </div>
        <div>
          <label className="swa-form-label">Website URL</label>
          <input className="swa-form-input" value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://..." />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label className="swa-form-label">Sort Order</label>
          <input type="number" className="swa-form-input" value={form.sortOrder} onChange={e => set('sortOrder', parseInt(e.target.value) || 0)} />
          <span style={{ fontSize: 10, color: 'var(--color-text-faint)' }}>Lower = first</span>
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
        <button onClick={() => onSave(form)} disabled={saving || !form.name || !form.slug}
          className="swa-btn swa-btn--primary" style={{ opacity: saving || !form.name || !form.slug ? 0.5 : 1 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{saving ? 'hourglass_empty' : 'save'}</span>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} className="swa-btn" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)' }}>Cancel</button>
      </div>
    </div>
  );
}

export default function AdminPartnersPage() {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? partners : partners.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q)
    );
  }, [partners, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/partners?all=true');
      const d = await res.json();
      setPartners(d.partners ?? []);
    } catch { setError('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (form: FormData) => {
    setCreating(true); setError(null);
    try {
      const res = await fetch('/api/admin/partners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Create failed');
      setPartners(prev => [d.partner, ...prev]);
      setShowCreate(false);
    } catch (err) { setError(err instanceof Error ? err.message : 'Create failed'); }
    finally { setCreating(false); }
  };

  const handleUpdate = async (id: string, patch: Partial<Partner> | FormData) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/partners/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Update failed');
      setPartners(prev => prev.map(p => p.id === id ? d.partner : p));
      setEditId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const res = await fetch(`/api/admin/partners/${id}`, { method: 'DELETE' });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Delete failed'); }
    setPartners(prev => prev.filter(p => p.id !== id));
  };

  const toggleActive = async (p: Partner) => {
    try { await handleUpdate(p.id, { active: !p.active }); } catch (err) { setError(err instanceof Error ? err.message : 'Toggle failed'); }
  };

  return (
    <>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Partners</h1>
          <p className="swa-page-subtitle">Manage partner profiles · {partners.length > 0 ? `${partners.length} total, ${partners.filter(p => p.active).length} active` : 'loading…'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/partners" className="swa-btn" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)', textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>open_in_new</span> View Page
          </Link>
          <button onClick={() => setShowCreate(true)} className="swa-btn swa-btn--primary">
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span> Add Partner
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--color-error)', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}

      {showCreate && (
        <div className="swa-card" style={{ marginBottom: 20, borderColor: 'var(--color-primary-light)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-primary)' }}>New Partner</div>
          <PartnerForm initial={emptyForm} onSave={handleCreate} onCancel={() => setShowCreate(false)} saving={creating} />
        </div>
      )}

      {/* Search row */}
      {!loading && partners.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 340 }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 17, color: '#9CA3AF', pointerEvents: 'none' }}>search</span>
            <input type="search" placeholder="Search partners…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="swa-form-input" style={{ paddingLeft: 36 }} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-text-faint)', marginLeft: 'auto' }}>
            {filtered.length} of {partners.length}
          </span>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-faint)' }}>Loading...</div>}

      {!loading && partners.length === 0 && !showCreate && (
        <div className="swa-card" style={{ textAlign: 'center', padding: 48 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-text-faint)', display: 'block', marginBottom: 8 }}>handshake</span>
          <p style={{ color: 'var(--color-text-faint)', margin: 0 }}>No partners yet. Click &quot;Add Partner&quot; to create one.</p>
        </div>
      )}

      {!loading && partners.length > 0 && (
        <div className="swa-card" style={{ padding: 0 }}>
          <table className="swa-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: 44 }}></th>
                <th>Partner</th>
                <th>Slug</th>
                <th style={{ width: 60 }}>Order</th>
                <th style={{ width: 80 }}>Status</th>
                <th style={{ width: 100, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-faint)' }}>No partners match your search.</td></tr>
              )}
              {paginated.map(p => (
                <React.Fragment key={p.id}>
                  <tr style={{ opacity: p.active ? 1 : 0.5 }}>
                    <td>
                      <div style={{ width: 32, height: 32, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                        {p.logoUrl ? (
                          <Image src={p.logoUrl} alt={p.name} width={24} height={24} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} unoptimized />
                        ) : (
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-faint)' }}>{p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{p.name}</div>
                      {p.url && <div style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>{p.url}</div>}
                    </td>
                    <td><span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{p.slug}</span></td>
                    <td style={{ textAlign: 'center' }}><span className="swa-badge swa-badge--primary">#{p.sortOrder}</span></td>
                    <td>
                      <button onClick={() => toggleActive(p)} className={`swa-badge ${p.active ? 'swa-badge--success' : ''}`}
                        style={{ cursor: 'pointer', border: 'none', background: p.active ? undefined : 'rgba(156,163,175,0.1)', color: p.active ? undefined : 'var(--color-text-faint)' }}>
                        {p.active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button onClick={() => setEditId(editId === p.id ? null : p.id)} className="swa-btn-ghost" title="Edit"
                          style={{ padding: 4, color: editId === p.id ? 'var(--color-primary)' : undefined }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{editId === p.id ? 'expand_less' : 'edit'}</span>
                        </button>
                        <Link href={`/partners/${p.slug}`} className="swa-btn-ghost" title="View" style={{ padding: 4 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
                        </Link>
                        <button onClick={async () => {
                          try { await handleDelete(p.id, p.name); }
                          catch (err) { setError(err instanceof Error ? err.message : 'Delete failed'); }
                        }} className="swa-btn-ghost" title="Delete" style={{ padding: 4, color: 'var(--color-error)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editId === p.id && (
                    <tr>
                      <td colSpan={6} style={{ padding: '0 0 8px 0', background: '#FAFAFA', borderTop: 'none' }}>
                        <div style={{ padding: '16px 20px', borderLeft: '3px solid var(--color-primary)', margin: '0 4px 4px' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--color-text-primary)' }}>Edit: {p.name}</div>
                          <PartnerForm
                            initial={{ name: p.name, description: p.description ?? '', logoUrl: p.logoUrl ?? '', url: p.url ?? '', slug: p.slug, sortOrder: p.sortOrder, active: p.active }}
                            onSave={d => handleUpdate(p.id, d)}
                            onCancel={() => setEditId(null)}
                            saving={updatingId === p.id}
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


      {!loading && partners.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-faint)', display: 'flex', gap: 16 }}>
            <span>{partners.length} total</span>
            <span>{partners.filter(p => p.active).length} active</span>
            <span>{partners.filter(p => !p.active).length} hidden</span>
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
