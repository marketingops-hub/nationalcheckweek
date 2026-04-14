'use client';

import { useState } from 'react';
import { type AmbassadorCategory } from './types';

const ICON_OPTIONS = ['school','cast_for_education','psychology','business_center','star','science','diversity_3','person','health_and_safety','sports','music_note','mic','public','volunteer_activism'];
const COLOR_OPTIONS = ['#2563eb','#16a34a','#7c3aed','#d97706','#db2777','#0891b2','#dc2626','#059669','#9333ea','#ea580c'];

function slugifyStr(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

export default function CategoriesManager({
  categories,
  onUpdated,
}: {
  categories: AmbassadorCategory[];
  onUpdated: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editCat, setEditCat] = useState<AmbassadorCategory | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', color: '#7c3aed', icon: 'diversity_3', sort_order: 0 });
  const [autoSlug, setAutoSlug] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [catError, setCatError] = useState('');

  function openNew() {
    setEditCat(null);
    setForm({ name: '', slug: '', description: '', color: '#7c3aed', icon: 'diversity_3', sort_order: categories.length });
    setAutoSlug(true);
    setCatError('');
    setShowForm(true);
  }

  function openEdit(c: AmbassadorCategory) {
    setEditCat(c);
    setForm({ name: c.name, slug: c.slug, description: c.description, color: c.color, icon: c.icon, sort_order: c.sort_order });
    setAutoSlug(false);
    setCatError('');
    setShowForm(true);
  }

  function setF(k: string, v: string | number) {
    setForm(p => {
      const n = { ...p, [k]: v };
      if (k === 'name' && autoSlug) n.slug = slugifyStr(v as string);
      return n;
    });
  }

  async function handleSave() {
    if (!form.name || !form.slug) { setCatError('Name and slug are required'); return; }
    setSaving(true); setCatError('');
    try {
      const url = editCat ? `/api/admin/ambassadors/categories/${editCat.id}` : '/api/admin/ambassadors/categories';
      const method = editCat ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Save failed');
      onUpdated();
      setShowForm(false);
    } catch (e) { setCatError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  }

  async function handleDelete(c: AmbassadorCategory) {
    if (!confirm(`Delete category "${c.name}"? Ambassadors in this category will be uncategorised.`)) return;
    setDeletingId(c.id);
    try {
      await fetch(`/api/admin/ambassadors/categories/${c.id}`, { method: 'DELETE' });
      onUpdated();
    } finally { setDeletingId(null); }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>Ambassador Categories</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-faint)', marginTop: 2 }}>Define types of ambassadors — used for filters and page layouts</div>
        </div>
        <button onClick={openNew} className="swa-btn swa-btn--primary">
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span> Add Category
        </button>
      </div>

      {showForm && (
        <div className="swa-card" style={{ marginBottom: 20, borderColor: 'var(--color-primary-light)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: 'var(--color-text-primary)' }}>
            {editCat ? `Edit: ${editCat.name}` : 'New Category'}
          </div>
          {catError && <div style={{ fontSize: 12, color: 'var(--color-error)', marginBottom: 10 }}>{catError}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="swa-form-label">Name *</label>
              <input className="swa-form-input" value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. Psychologist" />
            </div>
            <div>
              <label className="swa-form-label">Slug * {autoSlug && <span style={{ fontWeight: 400, color: 'var(--color-text-faint)' }}>(auto)</span>}</label>
              <input className="swa-form-input" value={form.slug} onChange={e => { setAutoSlug(false); setF('slug', e.target.value); }} placeholder="psychologist" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="swa-form-label">Description</label>
              <input className="swa-form-input" value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Short description of this category" />
            </div>
            <div>
              <label className="swa-form-label">Icon (Material Symbol)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {ICON_OPTIONS.map(ic => (
                  <button key={ic} type="button" onClick={() => setF('icon', ic)}
                    title={ic}
                    style={{ width: 34, height: 34, borderRadius: 6, border: `2px solid ${form.icon === ic ? form.color : 'var(--color-border)'}`, background: form.icon === ic ? form.color + '22' : 'var(--color-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: form.icon === ic ? form.color : 'var(--color-text-faint)' }}>{ic}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="swa-form-label">Colour</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {COLOR_OPTIONS.map(col => (
                  <button key={col} type="button" onClick={() => setF('color', col)}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: col, border: `3px solid ${form.color === col ? 'var(--color-text-primary)' : 'transparent'}`, cursor: 'pointer' }} />
                ))}
                <input type="color" value={form.color} onChange={e => setF('color', e.target.value)}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0 }} title="Custom colour" />
              </div>
            </div>
            <div>
              <label className="swa-form-label">Sort Order</label>
              <input type="number" className="swa-form-input" value={form.sort_order} onChange={e => setF('sort_order', parseInt(e.target.value) || 0)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: form.color + '18', borderRadius: 8, border: `1px solid ${form.color}44` }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: form.color }}>{form.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: form.color }}>{form.name || 'Preview'}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={handleSave} disabled={saving} className="swa-btn swa-btn--primary" style={{ opacity: saving ? 0.7 : 1 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{saving ? 'hourglass_empty' : 'save'}</span>
              {saving ? 'Saving…' : 'Save Category'}
            </button>
            <button onClick={() => setShowForm(false)} className="swa-btn" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)' }}>Cancel</button>
          </div>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="swa-card" style={{ textAlign: 'center', padding: 32 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--color-text-faint)', display: 'block', marginBottom: 8 }}>category</span>
          <p style={{ color: 'var(--color-text-faint)', margin: 0, fontSize: 13 }}>No categories yet. Click "Add Category" to create one.</p>
        </div>
      ) : (
        <div className="swa-card" style={{ padding: 0, overflow: 'hidden' }}>
          {categories.map((c, i) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < categories.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: c.color + '18', border: `1px solid ${c.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: c.color }}>{c.icon}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}>{c.name}</div>
                {c.description && <div style={{ fontSize: 12, color: 'var(--color-text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</div>}
              </div>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{c.slug}</span>
              <span style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>order: {c.sort_order}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => openEdit(c)} className="swa-btn-ghost" title="Edit" style={{ padding: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                </button>
                <button onClick={() => handleDelete(c)} disabled={deletingId === c.id} className="swa-btn-ghost" title="Delete" style={{ padding: 4, color: 'var(--color-error)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{deletingId === c.id ? 'hourglass_empty' : 'delete'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
