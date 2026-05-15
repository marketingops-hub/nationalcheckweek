'use client';

import { useState } from 'react';
import AmbassadorForm from './AmbassadorForm';
import BioGenerator from './BioGenerator';
import { type Ambassador, type AmbassadorFormData, type AmbassadorCategory } from './types';

export default function EditPanel({
  a,
  savingId,
  onSave,
  onCancel,
  categories,
}: {
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
    categoryId: a.categoryId ?? '', comment: a.comment ?? '', event_link: a.event_link ?? '',
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
