'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { adminFetch } from '@/lib/adminFetch';
import { type AmbassadorFormData, type AmbassadorCategory, slugify } from './types';

export default function AmbassadorForm({
  initial, onSave, onCancel, saving, categories,
}: {
  initial: AmbassadorFormData;
  onSave: (d: AmbassadorFormData) => void;
  onCancel: () => void;
  saving: boolean;
  categories: AmbassadorCategory[];
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
      const res = await adminFetch('/api/admin/upload', { method: 'POST', body: fd });
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

      <div>
        <label className="swa-form-label">Comment</label>
        <textarea className="swa-form-textarea" rows={4} value={form.comment} onChange={e => set('comment', e.target.value)} placeholder="What they think about National Check-in Week..." />
        <span style={{ fontSize: 10, color: 'var(--color-text-faint)' }}>Ambassador's thoughts or testimonial about National Check-in Week</span>
      </div>

      <div>
        <label className="swa-form-label">Event Link URL</label>
        <input className="swa-form-input" type="url" value={form.event_link} onChange={e => set('event_link', e.target.value)} placeholder="https://nationalcheckinweek.com/events/..." />
        <span style={{ fontSize: 10, color: 'var(--color-text-faint)' }}>Link to events this ambassador is involved in (used for 'Register for events' button)</span>
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
