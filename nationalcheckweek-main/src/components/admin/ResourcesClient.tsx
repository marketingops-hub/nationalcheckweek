'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { adminFetch } from '@/lib/adminFetch';
import RichTextEditor from './RichTextEditor';

const PAGE_SIZE = 15;

interface Resource {
  id: string;
  name: string;
  description?: string | null;
  content?: string | null;
  thumbnailUrl?: string | null;
  url?: string | null;
  slug: string;
  category?: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

type FormData = {
  name: string; description: string; content: string; thumbnailUrl: string; url: string;
  slug: string; category: string; sortOrder: number; active: boolean;
};

const emptyForm: FormData = {
  name: '', description: '', content: '', thumbnailUrl: '', url: '', slug: '', category: '', sortOrder: 0, active: true,
};

function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

function ResourceForm({ initial, onSave, onCancel, saving }: {
  initial: FormData; onSave: (d: FormData) => void; onCancel: () => void; saving: boolean;
}) {
  const [form, setForm] = useState<FormData>(initial);
  const [autoSlug, setAutoSlug] = useState(!initial.name);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof FormData, v: string | number | boolean) =>
    setForm(p => { const n = { ...p, [k]: v }; if (k === 'name' && autoSlug) n.slug = slugify(v as string); return n; });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadErr(null);
    try {
      const fd = new window.FormData();
      fd.append('file', file);
      fd.append('folder', 'resources');
      const res = await adminFetch('/api/admin/upload', { method: 'POST', body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Upload failed');
      set('thumbnailUrl', d.url);
    } catch (err) { setUploadErr(err instanceof Error ? err.message : 'Upload failed'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label className="swa-form-label">Resource Name *</label>
          <input className="swa-form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Student Wellbeing Toolkit" />
        </div>
        <div>
          <label className="swa-form-label">URL Slug * {autoSlug && <span style={{ color: 'var(--color-text-faint)', fontWeight: 400 }}>(auto)</span>}</label>
          <input className="swa-form-input" value={form.slug} onChange={e => { setAutoSlug(false); set('slug', e.target.value); }} placeholder="student-wellbeing-toolkit" />
          <span style={{ fontSize: 10, color: 'var(--color-text-faint)' }}>/resources/{form.slug || '...'}</span>
        </div>
      </div>
      <div>
        <label className="swa-form-label">Description</label>
        <textarea className="swa-form-textarea" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Short description for listing page..." />
        <span style={{ fontSize: 10, color: 'var(--color-text-faint)' }}>Shown on /resources listing page</span>
      </div>
      <div>
        <label className="swa-form-label">Content</label>
        <RichTextEditor 
          value={form.content} 
          onChange={(html) => set('content', html)} 
          placeholder="Full content for detail page..."
          minHeight={300}
        />
        <span style={{ fontSize: 10, color: 'var(--color-text-faint)', marginTop: 4, display: 'block' }}>Shown on individual resource detail page • Supports bold, italic, links, headings, lists</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label className="swa-form-label">Thumbnail</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: 10, overflow: 'hidden', border: '2px solid var(--color-border)', background: 'var(--color-primary-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 6 }}>
              {form.thumbnailUrl ? (
                <Image src={form.thumbnailUrl} alt="Preview" width={52} height={52} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} unoptimized />
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--color-text-faint)' }}>description</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="swa-btn" style={{ fontSize: 12, padding: '6px 12px', background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{uploading ? 'hourglass_empty' : 'upload'}</span>
                {uploading ? 'Uploading...' : 'Upload Thumbnail'}
              </button>
              {form.thumbnailUrl && (
                <button type="button" onClick={() => set('thumbnailUrl', '')} style={{ fontSize: 11, color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>Remove thumbnail</button>
              )}
              {uploadErr && <span style={{ fontSize: 11, color: 'var(--color-error)' }}>{uploadErr}</span>}
              <input className="swa-form-input" value={form.thumbnailUrl} onChange={e => set('thumbnailUrl', e.target.value)} placeholder="Or paste URL..." style={{ fontSize: 11, padding: '4px 8px' }} />
            </div>
          </div>
        </div>
        <div>
          <label className="swa-form-label">Resource URL</label>
          <input className="swa-form-input" value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://..." />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div>
          <label className="swa-form-label">Category</label>
          <input className="swa-form-input" value={form.category} onChange={e => set('category', e.target.value)} placeholder="Wellbeing, Mental Health..." />
        </div>
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
        <button onClick={() => onSave(form)} disabled={saving || uploading || !form.name || !form.slug}
          className="swa-btn swa-btn--primary" style={{ opacity: saving || uploading || !form.name || !form.slug ? 0.5 : 1 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{saving ? 'hourglass_empty' : 'save'}</span>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} className="swa-btn" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)' }}>Cancel</button>
      </div>
    </div>
  );
}

export default function ResourcesClient() {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? resources : resources.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.slug.toLowerCase().includes(q) ||
      (r.description ?? '').toLowerCase().includes(q) ||
      (r.category ?? '').toLowerCase().includes(q)
    );
  }, [resources, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fetchAll = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/resources?all=true');
      const d = await res.json();
      setResources(d.resources ?? []);
    } catch { setError('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (form: FormData) => {
    setCreating(true); setError(null);
    try {
      const res = await adminFetch('/api/admin/resources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Create failed');
      setResources(prev => [d.resource, ...prev]);
      setShowCreate(false);
    } catch (err) { setError(err instanceof Error ? err.message : 'Create failed'); }
    finally { setCreating(false); }
  };

  const handleUpdate = async (id: string, patch: Partial<Resource> | FormData) => {
    setUpdatingId(id);
    try {
      const res = await adminFetch(`/api/admin/resources/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Update failed');
      setResources(prev => prev.map(r => r.id === id ? d.resource : r));
      setEditId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const res = await adminFetch(`/api/admin/resources/${id}`, { method: 'DELETE' });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Delete failed'); }
    setResources(prev => prev.filter(r => r.id !== id));
  };

  const toggleActive = async (r: Resource) => {
    try { await handleUpdate(r.id, { active: !r.active }); } catch (err) { setError(err instanceof Error ? err.message : 'Toggle failed'); }
  };

  return (
    <>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Resources</h1>
          <p className="swa-page-subtitle">Manage educational resources · {resources.length > 0 ? `${resources.length} total, ${resources.filter(r => r.active).length} active` : 'loading…'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/resources" className="swa-btn" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)', textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>open_in_new</span> View Page
          </Link>
          <button onClick={() => setShowCreate(true)} className="swa-btn swa-btn--primary">
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span> Add Resource
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
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-primary)' }}>New Resource</div>
          <ResourceForm initial={emptyForm} onSave={handleCreate} onCancel={() => setShowCreate(false)} saving={creating} />
        </div>
      )}

      {!loading && resources.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 340 }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 17, color: '#9CA3AF', pointerEvents: 'none' }}>search</span>
            <input type="search" placeholder="Search resources…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="swa-form-input" style={{ paddingLeft: 36 }} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-text-faint)', marginLeft: 'auto' }}>
            {filtered.length} of {resources.length}
          </span>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-faint)' }}>Loading...</div>}

      {!loading && resources.length === 0 && !showCreate && (
        <div className="swa-card" style={{ textAlign: 'center', padding: 48 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-text-faint)', display: 'block', marginBottom: 8 }}>description</span>
          <p style={{ color: 'var(--color-text-faint)', margin: 0 }}>No resources yet. Click &quot;Add Resource&quot; to create one.</p>
        </div>
      )}

      {!loading && resources.length > 0 && (
        <div className="swa-card" style={{ padding: 0 }}>
          <table className="swa-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: 44 }}></th>
                <th>Resource</th>
                <th>Category</th>
                <th>Slug</th>
                <th style={{ width: 60 }}>Order</th>
                <th style={{ width: 80 }}>Status</th>
                <th style={{ width: 100, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-faint)' }}>No resources match your search.</td></tr>
              )}
              {paginated.map(r => (
                <React.Fragment key={r.id}>
                  <tr style={{ opacity: r.active ? 1 : 0.5 }}>
                    <td>
                      <div style={{ width: 32, height: 32, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                        {r.thumbnailUrl ? (
                          <Image src={r.thumbnailUrl} alt={r.name} width={24} height={24} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} unoptimized />
                        ) : (
                          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-faint)' }}>{r.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.name}</div>
                      {r.url && <div style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>{r.url}</div>}
                    </td>
                    <td>{r.category ? <span className="swa-badge">{r.category}</span> : <span style={{ color: 'var(--color-text-faint)', fontSize: 12 }}>—</span>}</td>
                    <td><span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{r.slug}</span></td>
                    <td style={{ textAlign: 'center' }}><span className="swa-badge swa-badge--primary">#{r.sortOrder}</span></td>
                    <td>
                      <button onClick={() => toggleActive(r)} className={`swa-badge ${r.active ? 'swa-badge--success' : ''}`}
                        style={{ cursor: 'pointer', border: 'none', background: r.active ? undefined : 'rgba(156,163,175,0.1)', color: r.active ? undefined : 'var(--color-text-faint)' }}>
                        {r.active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button onClick={() => setEditId(editId === r.id ? null : r.id)} className="swa-btn-ghost" title="Edit"
                          style={{ padding: 4, color: editId === r.id ? 'var(--color-primary)' : undefined }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{editId === r.id ? 'expand_less' : 'edit'}</span>
                        </button>
                        <Link href={`/resources/${r.slug}`} className="swa-btn-ghost" title="View" style={{ padding: 4 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
                        </Link>
                        <button onClick={async () => {
                          try { await handleDelete(r.id, r.name); }
                          catch (err) { setError(err instanceof Error ? err.message : 'Delete failed'); }
                        }} className="swa-btn-ghost" title="Delete" style={{ padding: 4, color: 'var(--color-error)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editId === r.id && (
                    <tr>
                      <td colSpan={7} style={{ padding: '0 0 8px 0', background: '#FAFAFA', borderTop: 'none' }}>
                        <div style={{ padding: '16px 20px', borderLeft: '3px solid var(--color-primary)', margin: '0 4px 4px' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--color-text-primary)' }}>Edit: {r.name}</div>
                          <ResourceForm
                            initial={{ name: r.name, description: r.description ?? '', content: r.content ?? '', thumbnailUrl: r.thumbnailUrl ?? '', url: r.url ?? '', slug: r.slug, category: r.category ?? '', sortOrder: r.sortOrder, active: r.active }}
                            onSave={d => handleUpdate(r.id, d)}
                            onCancel={() => setEditId(null)}
                            saving={updatingId === r.id}
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

      {!loading && resources.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-faint)', display: 'flex', gap: 16 }}>
            <span>{resources.length} total</span>
            <span>{resources.filter(r => r.active).length} active</span>
            <span>{resources.filter(r => !r.active).length} hidden</span>
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
