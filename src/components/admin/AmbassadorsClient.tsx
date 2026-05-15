'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AmbassadorForm from './ambassadors/AmbassadorForm';
import CategoriesManager from './ambassadors/CategoriesManager';
import EditPanel from './ambassadors/EditPanel';
import { type Ambassador, type AmbassadorCategory, type AmbassadorFormData, emptyForm } from './ambassadors/types';
import { adminFetch } from '@/lib/adminFetch';

export type { AmbassadorCategory };

// ── Main AmbassadorsClient ──────────────────────────────────────────
export default function AmbassadorsClient() {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [categories, setCategories] = useState<AmbassadorCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ambassadors' | 'categories'>('ambassadors');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [ambRes, catRes] = await Promise.all([
        adminFetch('/api/admin/ambassadors?all=true'),
        adminFetch('/api/admin/ambassadors/categories'),
      ]);
      const ambData = await ambRes.json();
      const catData = await catRes.json();
      setAmbassadors(ambData.ambassadors ?? []);
      setCategories(catData.categories ?? []);
    } catch (err) { 
      const errorMsg = err instanceof Error ? err.message : 'Failed to load';
      console.error('Ambassadors fetch error:', err);
      setError(errorMsg);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (form: AmbassadorFormData) => {
    setCreating(true); setError(null);
    try {
      const res = await adminFetch('/api/admin/ambassadors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, categoryId: form.categoryId || null }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Create failed');
      setAmbassadors(prev => [d.ambassador, ...prev]);
      setShowCreate(false);
    } catch (err) { setError(err instanceof Error ? err.message : 'Create failed'); }
    finally { setCreating(false); }
  };

  const handleUpdate = async (id: string, patch: Partial<Ambassador> | AmbassadorFormData, closeOnDone = true) => {
    setSavingId(id); setError(null);
    try {
      const res = await adminFetch(`/api/admin/ambassadors/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Update failed');
      setAmbassadors(prev => prev.map(a => a.id === id ? d.ambassador : a));
      if (closeOnDone) setEditId(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'Update failed'); }
    finally { setSavingId(null); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/ambassadors/${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Delete failed'); }
      setAmbassadors(prev => prev.filter(a => a.id !== id));
      if (editId === id) setEditId(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'Delete failed'); }
  };

  const toggleActive = async (a: Ambassador) => {
    await handleUpdate(a.id, { active: !a.active }, false);
  };

  const filteredAmbassadors = filterCategory === '__none__'
    ? ambassadors.filter(a => !a.categoryId)
    : filterCategory
      ? ambassadors.filter(a => a.categoryId === filterCategory)
      : ambassadors;

  const renderRow = (a: Ambassador) => {
    const cat = a.ambassador_categories;
    return (
      <div key={a.id}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', opacity: a.active ? 1 : 0.5, borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--color-primary-light)', background: 'var(--color-primary-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {a.photoUrl ? (
              <Image src={a.photoUrl} alt={a.name} width={40} height={40} style={{ width: '100%', height: '100%', objectFit: 'cover' }} unoptimized />
            ) : (
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>{a.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 14 }}>{a.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
              {a.title && <span style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>{a.title}</span>}
              {cat && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: cat.color + '18', color: cat.color, border: `1px solid ${cat.color}33` }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 11 }}>{cat.icon}</span>
                  {cat.name}
                </span>
              )}
            </div>
          </div>
          <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--color-text-muted)', flexShrink: 0 }}>{a.slug}</span>
          <span className="swa-badge swa-badge--primary" style={{ flexShrink: 0 }}>#{a.sortOrder}</span>
          <button onClick={() => toggleActive(a)} className={`swa-badge ${a.active ? 'swa-badge--success' : ''}`}
            style={{ cursor: 'pointer', border: 'none', flexShrink: 0, background: a.active ? undefined : 'rgba(156,163,175,0.1)', color: a.active ? undefined : 'var(--color-text-faint)' }}>
            {a.active ? 'Active' : 'Hidden'}
          </button>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button onClick={() => setEditId(editId === a.id ? null : a.id)}
              className="swa-btn-ghost" title="Edit"
              style={{ padding: 4, color: editId === a.id ? 'var(--color-primary)' : undefined }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{editId === a.id ? 'close' : 'edit'}</span>
            </button>
            <Link href={`/ambassadors/${a.slug}`} className="swa-btn-ghost" title="View" style={{ padding: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
            </Link>
            <button onClick={() => handleDelete(a.id, a.name)} className="swa-btn-ghost" title="Delete" style={{ padding: 4, color: 'var(--color-error)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
            </button>
          </div>
        </div>
        {editId === a.id && (
          <EditPanel
            key={a.id + a.updatedAt}
            a={a}
            savingId={savingId}
            onSave={(d: AmbassadorFormData) => handleUpdate(a.id, { ...d, categoryId: d.categoryId || null })}
            onCancel={() => setEditId(null)}
            categories={categories}
          />
        )}
      </div>
    );
  };

  return (
    <>
      <div className="swa-page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Ambassadors</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-faint)', margin: '2px 0 0' }}>Manage ambassador profiles and categories</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/ambassadors" className="swa-btn" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)', textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>open_in_new</span> View Page
          </Link>
          {activeTab === 'ambassadors' && (
            <button onClick={() => { setShowCreate(true); setEditId(null); }} className="swa-btn swa-btn--primary">
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span> Add Ambassador
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--color-border)', marginBottom: 24 }}>
        {(['ambassadors', 'categories'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent', marginBottom: -2, color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-muted)', textTransform: 'capitalize' }}>
            {tab === 'ambassadors' ? (
              <><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 5 }}>diversity_3</span>Ambassadors ({ambassadors.length})</>
            ) : (
              <><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 5 }}>category</span>Categories ({categories.length})</>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--color-error)', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}

      {activeTab === 'categories' && (
        <CategoriesManager categories={categories} onUpdated={fetchAll} />
      )}

      {activeTab === 'ambassadors' && (
        <>
          {showCreate && (
            <div className="swa-card" style={{ marginBottom: 20, borderColor: 'var(--color-primary-light)' }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-primary)' }}>New Ambassador</div>
              <AmbassadorForm initial={emptyForm} onSave={handleCreate} onCancel={() => setShowCreate(false)} saving={creating} categories={categories} />
            </div>
          )}

          {/* Category filter chips */}
          {!loading && categories.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              <button onClick={() => setFilterCategory('')}
                style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1px solid ${!filterCategory ? 'var(--color-primary)' : 'var(--color-border)'}`, background: !filterCategory ? 'var(--color-primary-light)' : 'var(--color-card)', color: !filterCategory ? 'var(--color-primary)' : 'var(--color-text-muted)', cursor: 'pointer' }}>
                All ({ambassadors.length})
              </button>
              {categories.map(c => {
                const count = ambassadors.filter(a => a.categoryId === c.id).length;
                const active = filterCategory === c.id;
                return (
                  <button key={c.id} onClick={() => setFilterCategory(active ? '' : c.id)}
                    style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1px solid ${active ? c.color : 'var(--color-border)'}`, background: active ? c.color + '18' : 'var(--color-card)', color: active ? c.color : 'var(--color-text-muted)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{c.icon}</span>
                    {c.name} ({count})
                  </button>
                );
              })}
              {ambassadors.filter(a => !a.categoryId).length > 0 && (
                <button onClick={() => setFilterCategory('__none__')}
                  style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1px solid ${filterCategory === '__none__' ? 'var(--color-text-muted)' : 'var(--color-border)'}`, background: filterCategory === '__none__' ? 'rgba(0,0,0,0.06)' : 'var(--color-card)', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                  Uncategorised ({ambassadors.filter(a => !a.categoryId).length})
                </button>
              )}
            </div>
          )}

          {loading && <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-faint)' }}>Loading...</div>}

          {!loading && filteredAmbassadors.length === 0 && !showCreate && (
            <div className="swa-card" style={{ textAlign: 'center', padding: 48 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-text-faint)', display: 'block', marginBottom: 8 }}>diversity_3</span>
              <p style={{ color: 'var(--color-text-faint)', margin: 0 }}>No ambassadors found. {filterCategory ? 'Try clearing the filter.' : 'Click "Add Ambassador" to create one.'}</p>
            </div>
          )}

          {!loading && filteredAmbassadors.length > 0 && (
            <div className="swa-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-faint)' }}>
                <div style={{ width: 40, flexShrink: 0 }}></div>
                <div style={{ flex: 1 }}>Ambassador</div>
                <span style={{ width: 120, flexShrink: 0 }}>Slug</span>
                <span style={{ width: 50, flexShrink: 0, textAlign: 'center' }}>Order</span>
                <span style={{ width: 60, flexShrink: 0 }}>Status</span>
                <span style={{ width: 88, flexShrink: 0, textAlign: 'right' }}>Actions</span>
              </div>
              {filteredAmbassadors.map(a => renderRow(a))}
            </div>
          )}

          {!loading && ambassadors.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', gap: 16, fontSize: 12, color: 'var(--color-text-faint)' }}>
              <span>{ambassadors.length} total</span>
              <span>{ambassadors.filter(a => a.active).length} active</span>
              <span>{ambassadors.filter(a => !a.active).length} hidden</span>
              <span>{ambassadors.filter(a => !a.categoryId).length} uncategorised</span>
            </div>
          )}
        </>
      )}
    </>
  );
}
