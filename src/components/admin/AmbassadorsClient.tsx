'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export interface AmbassadorCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

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
  categoryId?: string | null;
  ambassador_categories?: AmbassadorCategory | null;
  createdAt: string;
  updatedAt: string;
}

type AmbassadorFormData = {
  name: string; title: string; bio: string; photoUrl: string;
  slug: string; sortOrder: number; active: boolean;
  linkedinUrl: string; websiteUrl: string; categoryId: string;
};

const emptyForm: AmbassadorFormData = {
  name: '', title: '', bio: '', photoUrl: '', slug: '', sortOrder: 0,
  active: true, linkedinUrl: '', websiteUrl: '', categoryId: '',
};

function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

function AmbassadorForm({ initial, onSave, onCancel, saving, categories }: {
  initial: AmbassadorFormData; onSave: (d: AmbassadorFormData) => void; onCancel: () => void; saving: boolean; categories: AmbassadorCategory[];
}) {
  const [form, setForm] = useState<AmbassadorFormData>(initial);
  const [autoSlug, setAutoSlug] = useState(!initial.name);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof AmbassadorFormData, v: string | number | boolean) =>
    setForm(p => { const n = { ...p, [k]: v }; if (k === 'name' && autoSlug) n.slug = slugify(v as string); return n; });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setUploadErr(null);
    try {
      const fd = new window.FormData();
      fd.append('file', file);
      fd.append('folder', 'ambassadors');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Upload failed');
      set('photoUrl', d.url);
    } catch (err) { setUploadErr(err instanceof Error ? err.message : 'Upload failed'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label className="swa-form-label">Photo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--color-border)', background: 'var(--color-primary-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {form.photoUrl ? (
                <Image src={form.photoUrl} alt="Preview" width={64} height={64} style={{ width: '100%', height: '100%', objectFit: 'cover' }} unoptimized />
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--color-text-faint)' }}>person</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="swa-btn" style={{ fontSize: 12, padding: '6px 12px', background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{uploading ? 'hourglass_empty' : 'upload'}</span>
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </button>
              {form.photoUrl && (
                <button type="button" onClick={() => set('photoUrl', '')} style={{ fontSize: 11, color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>Remove photo</button>
              )}
              {uploadErr && <span style={{ fontSize: 11, color: 'var(--color-error)' }}>{uploadErr}</span>}
              <input className="swa-form-input" value={form.photoUrl} onChange={e => set('photoUrl', e.target.value)} placeholder="Or paste URL..." style={{ fontSize: 11, padding: '4px 8px' }} />
            </div>
          </div>
        </div>
        <div>
          <label className="swa-form-label">URL Slug * {autoSlug && <span style={{ color: 'var(--color-text-faint)', fontWeight: 400 }}>(auto)</span>}</label>
          <input className="swa-form-input" value={form.slug} onChange={e => { setAutoSlug(false); set('slug', e.target.value); }} placeholder="jane-smith" />
          <span style={{ fontSize: 10, color: 'var(--color-text-faint)' }}>/ambassadors/{form.slug || '...'}</span>
        </div>
      </div>

      <div>
        <label className="swa-form-label">Bio</label>
        <textarea className="swa-form-textarea" rows={8} value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Write a detailed bio..." />
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
          <label className="swa-form-label">Category</label>
          <select className="swa-form-input" value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
            <option value="">— No category —</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="swa-form-label">Sort Order</label>
          <input type="number" className="swa-form-input" value={form.sortOrder} onChange={e => set('sortOrder', parseInt(e.target.value) || 0)} />
          <span style={{ fontSize: 10, color: 'var(--color-text-faint)' }}>Lower = first</span>
        </div>
      </div>

      <div>
        <label className="swa-form-label">Status</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <button type="button" onClick={() => set('active', !form.active)}
            className={`swa-toggle ${form.active ? 'on' : ''}`} style={{ marginRight: 4 }} />
          <span style={{ fontSize: 13, color: form.active ? 'var(--color-success)' : 'var(--color-text-faint)', fontWeight: 500 }}>
            {form.active ? 'Active' : 'Hidden'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
        <button onClick={() => onSave(form)} disabled={saving || uploading || !form.name || !form.slug}
          className="swa-btn swa-btn--primary" style={{ opacity: saving || !form.name || !form.slug ? 0.5 : 1 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{saving ? 'hourglass_empty' : 'save'}</span>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={onCancel} className="swa-btn" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)' }}>Cancel</button>
      </div>
    </div>
  );
}

function EditPanel({ a, savingId, onSave, onCancel, categories }: {
  a: Ambassador;
  savingId: string | null;
  onSave: (d: AmbassadorFormData) => void;
  onCancel: () => void;
  categories: AmbassadorCategory[];
}) {
  const [formData, setFormData] = useState<AmbassadorFormData>({
    name: a.name, title: a.title ?? '', bio: a.bio ?? '', photoUrl: a.photoUrl ?? '',
    slug: a.slug, sortOrder: a.sortOrder, active: a.active,
    linkedinUrl: a.linkedinUrl ?? '', websiteUrl: a.websiteUrl ?? '',
    categoryId: a.categoryId ?? '',
  });

  const applyBio = (bio: string) => setFormData((f: AmbassadorFormData) => ({ ...f, bio }));

  return (
    <div style={{ padding: '16px 20px', background: 'var(--color-primary-pale)', borderBottom: '2px solid var(--color-primary-light)' }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
        Editing: {a.name}
      </div>
      <AmbassadorForm
        key={JSON.stringify(formData.bio)}
        initial={formData}
        onSave={onSave}
        onCancel={onCancel}
        saving={savingId === a.id}
        categories={categories}
      />
      <BioGenerator ambassador={a} onApply={applyBio} />
    </div>
  );
}

function BioGenerator({ ambassador, onApply }: {
  ambassador: Ambassador;
  onApply: (bio: string) => void;
}) {
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedBio, setGeneratedBio] = useState('');
  const [genError, setGenError] = useState('');

  const handleGenerate = async () => {
    setGenerating(true); setGenError(''); setGeneratedBio('');
    try {
      const sb = createClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) { setGenError('Not authenticated.'); return; }

      const res = await fetch('/api/admin/ambassadors/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          name: ambassador.name,
          title: ambassador.title ?? '',
          linkedinUrl: ambassador.linkedinUrl ?? '',
          websiteUrl: ambassador.websiteUrl ?? '',
          notes,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Generation failed');
      setGeneratedBio(d.bio);
    } catch (err) { setGenError(err instanceof Error ? err.message : 'Generation failed'); }
    finally { setGenerating(false); }
  };

  return (
    <div style={{ marginTop: 20, padding: '16px 20px', background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(79,70,229,0.04))', border: '1px solid var(--color-primary-light)', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-primary)' }}>auto_awesome</span>
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-primary)' }}>BIO Generator</span>
        <span style={{ fontSize: 11, color: 'var(--color-text-faint)', marginLeft: 4 }}>AI-powered — prompt editable in Prompts section</span>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Extra context (optional)</label>
        <textarea
          className="swa-form-textarea"
          rows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder={`e.g. Focus on ${ambassador.name}'s work in rural schools, mention their 2022 award...`}
          style={{ fontSize: 13 }}
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="swa-btn swa-btn--primary"
        style={{ marginBottom: 12, opacity: generating ? 0.7 : 1 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{generating ? 'hourglass_empty' : 'auto_awesome'}</span>
        {generating ? 'Generating...' : 'Generate BIO'}
      </button>

      {genError && (
        <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: 'var(--color-error)', fontSize: 12, marginBottom: 10 }}>
          {genError}
        </div>
      )}

      {generatedBio && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Generated BIO — review before applying</div>
          <div style={{ padding: '12px 14px', background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13, color: 'var(--color-text-body)', lineHeight: 1.7, marginBottom: 10, whiteSpace: 'pre-wrap' }}>
            {generatedBio}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { onApply(generatedBio); setGeneratedBio(''); }}
              className="swa-btn swa-btn--primary"
              style={{ fontSize: 12 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
              Apply to BIO field
            </button>
            <button
              onClick={() => setGeneratedBio('')}
              className="swa-btn"
              style={{ fontSize: 12, background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)' }}
            >
              Discard
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="swa-btn"
              style={{ fontSize: 12, background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>refresh</span>
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Categories Manager ─────────────────────────────────────────────
const ICON_OPTIONS = ['school','cast_for_education','psychology','business_center','star','science','diversity_3','person','health_and_safety','sports','music_note','mic','public','volunteer_activism'];
const COLOR_OPTIONS = ['#2563eb','#16a34a','#7c3aed','#d97706','#db2777','#0891b2','#dc2626','#059669','#9333ea','#ea580c'];

function slugifyStr(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

function CategoriesManager({ categories, onUpdated }: { categories: AmbassadorCategory[]; onUpdated: () => void }) {
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
              <input className="swa-form-input" value={form.name} onChange={e => { setF('name', e.target.value); }} placeholder="e.g. Psychologist" />
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
        fetch('/api/admin/ambassadors?all=true'),
        fetch('/api/admin/ambassadors/categories'),
      ]);
      const ambData = await ambRes.json();
      const catData = await catRes.json();
      setAmbassadors(ambData.ambassadors ?? []);
      setCategories(catData.categories ?? []);
    } catch { setError('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (form: AmbassadorFormData) => {
    setCreating(true); setError(null);
    try {
      const res = await fetch('/api/admin/ambassadors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, categoryId: form.categoryId || null }) });
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
      const res = await fetch(`/api/admin/ambassadors/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
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
      const res = await fetch(`/api/admin/ambassadors/${id}`, { method: 'DELETE' });
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
