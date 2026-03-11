'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Ambassador {
  id: string;
  name: string;
  title?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  slug: string;
  sortOrder: number;
  active: boolean;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

type FormData = {
  name: string; title: string; bio: string; photoUrl: string;
  slug: string; sortOrder: number; active: boolean;
  linkedinUrl: string; websiteUrl: string;
};

const emptyForm: FormData = {
  name: '', title: '', bio: '', photoUrl: '', slug: '', sortOrder: 0,
  active: true, linkedinUrl: '', websiteUrl: '',
};

function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

function AmbassadorForm({ initial, onSave, onCancel, saving }: {
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
          <label className="swa-form-label">Full Name *</label>
          <input className="swa-form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Dr. Jane Smith" />
        </div>
        <div>
          <label className="swa-form-label">Title / Role</label>
          <input className="swa-form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Clinical Psychologist" />
        </div>
      </div>
      <div>
        <label className="swa-form-label">Bio</label>
        <textarea className="swa-form-textarea" rows={4} value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Write a bio..." />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label className="swa-form-label">Photo URL</label>
          <input className="swa-form-input" value={form.photoUrl} onChange={e => set('photoUrl', e.target.value)} placeholder="https://..." />
          {form.photoUrl && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                <Image src={form.photoUrl} alt="Preview" width={36} height={36} style={{ width: '100%', height: '100%', objectFit: 'cover' }} unoptimized />
              </div>
              <span style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>Preview</span>
            </div>
          )}
        </div>
        <div>
          <label className="swa-form-label">URL Slug * {autoSlug && <span style={{ color: 'var(--color-text-faint)', fontWeight: 400 }}>(auto)</span>}</label>
          <input className="swa-form-input" value={form.slug} onChange={e => { setAutoSlug(false); set('slug', e.target.value); }} placeholder="jane-smith" />
          <span style={{ fontSize: 10, color: 'var(--color-text-faint)' }}>/ambassadors/{form.slug || '...'}</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label className="swa-form-label">LinkedIn URL</label>
          <input className="swa-form-input" value={form.linkedinUrl} onChange={e => set('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/..." />
        </div>
        <div>
          <label className="swa-form-label">Website URL</label>
          <input className="swa-form-input" value={form.websiteUrl} onChange={e => set('websiteUrl', e.target.value)} placeholder="https://..." />
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
          className="swa-btn swa-btn-primary" style={{ opacity: saving || !form.name || !form.slug ? 0.5 : 1 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{saving ? 'hourglass_empty' : 'save'}</span>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} className="swa-btn" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)' }}>Cancel</button>
      </div>
    </div>
  );
}

export default function AdminAmbassadorsPage() {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ambassadors?all=true');
      const d = await res.json();
      setAmbassadors(d.ambassadors ?? []);
    } catch { setError('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (form: FormData) => {
    setCreating(true); setError(null);
    try {
      const res = await fetch('/api/admin/ambassadors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Create failed');
      setAmbassadors(prev => [d.ambassador, ...prev]);
      setShowCreate(false);
    } catch (err) { setError(err instanceof Error ? err.message : 'Create failed'); }
    finally { setCreating(false); }
  };

  const handleUpdate = async (id: string, patch: Partial<Ambassador> | FormData) => {
    const res = await fetch(`/api/admin/ambassadors/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || 'Update failed');
    setAmbassadors(prev => prev.map(a => a.id === id ? d.ambassador : a));
    setEditId(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const res = await fetch(`/api/admin/ambassadors/${id}`, { method: 'DELETE' });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Delete failed'); }
    setAmbassadors(prev => prev.filter(a => a.id !== id));
  };

  const toggleActive = async (a: Ambassador) => {
    try { await handleUpdate(a.id, { active: !a.active }); } catch (err) { setError(err instanceof Error ? err.message : 'Toggle failed'); }
  };

  return (
    <>
      {/* Page Header */}
      <div className="swa-page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Ambassadors</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-faint)', margin: '2px 0 0' }}>Manage ambassador profiles</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/ambassadors" className="swa-btn" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)', textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>open_in_new</span> View Page
          </Link>
          <button onClick={() => setShowCreate(true)} className="swa-btn swa-btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span> Add Ambassador
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
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-primary)' }}>New Ambassador</div>
          <AmbassadorForm initial={emptyForm} onSave={handleCreate} onCancel={() => setShowCreate(false)} saving={creating} />
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-faint)' }}>Loading...</div>}

      {!loading && ambassadors.length === 0 && !showCreate && (
        <div className="swa-card" style={{ textAlign: 'center', padding: 48 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-text-faint)', display: 'block', marginBottom: 8 }}>diversity_3</span>
          <p style={{ color: 'var(--color-text-faint)', margin: 0 }}>No ambassadors yet. Click "Add Ambassador" to create one.</p>
        </div>
      )}

      {!loading && ambassadors.length > 0 && (
        <div className="swa-card" style={{ padding: 0 }}>
          <table className="swa-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: 44 }}></th>
                <th>Ambassador</th>
                <th>Slug</th>
                <th style={{ width: 60 }}>Order</th>
                <th style={{ width: 80 }}>Status</th>
                <th style={{ width: 100, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ambassadors.map(a => (
                <tr key={a.id} style={{ opacity: a.active ? 1 : 0.5 }}>
                  <td>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--color-primary-light)', background: 'var(--color-primary-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {a.photoUrl ? (
                        <Image src={a.photoUrl} alt={a.name} width={32} height={32} style={{ width: '100%', height: '100%', objectFit: 'cover' }} unoptimized />
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)' }}>{a.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{a.name}</div>
                    {a.title && <div style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>{a.title}</div>}
                  </td>
                  <td><span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{a.slug}</span></td>
                  <td style={{ textAlign: 'center' }}><span className="swa-badge swa-badge--primary">#{a.sortOrder}</span></td>
                  <td>
                    <button onClick={() => toggleActive(a)} className={`swa-badge ${a.active ? 'swa-badge--success' : ''}`}
                      style={{ cursor: 'pointer', border: 'none', background: a.active ? undefined : 'rgba(156,163,175,0.1)', color: a.active ? undefined : 'var(--color-text-faint)' }}>
                      {a.active ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button onClick={() => setEditId(editId === a.id ? null : a.id)} className="swa-btn-ghost" title="Edit" style={{ padding: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                      </button>
                      <Link href={`/ambassadors/${a.slug}`} className="swa-btn-ghost" title="View" style={{ padding: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
                      </Link>
                      <button onClick={() => handleDelete(a.id, a.name)} className="swa-btn-ghost" title="Delete" style={{ padding: 4, color: 'var(--color-error)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inline edit form */}
      {editId && (() => {
        const a = ambassadors.find(x => x.id === editId);
        if (!a) return null;
        return (
          <div className="swa-card" style={{ marginTop: 16, borderColor: 'var(--color-primary-light)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-primary)' }}>Edit: {a.name}</div>
            <AmbassadorForm
              initial={{ name: a.name, title: a.title ?? '', bio: a.bio ?? '', photoUrl: a.photoUrl ?? '', slug: a.slug, sortOrder: a.sortOrder, active: a.active, linkedinUrl: a.linkedinUrl ?? '', websiteUrl: a.websiteUrl ?? '' }}
              onSave={d => handleUpdate(a.id, d)}
              onCancel={() => setEditId(null)}
              saving={false}
            />
          </div>
        );
      })()}

      {!loading && ambassadors.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', gap: 16, fontSize: 12, color: 'var(--color-text-faint)' }}>
          <span>{ambassadors.length} total</span>
          <span>{ambassadors.filter(a => a.active).length} active</span>
          <span>{ambassadors.filter(a => !a.active).length} hidden</span>
        </div>
      )}
    </>
  );
}
