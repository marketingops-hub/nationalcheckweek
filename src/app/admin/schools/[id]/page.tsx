import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SchoolEditForm from '@/components/admin/SchoolEditForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditSchoolPage({ params }: Props) {
  const { id } = await params;
  const sb = await createClient();

  const { data: school } = await sb
    .from('school_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (!school) notFound();

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Link
              href="/admin/schools"
              style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
            >
              ← Schools
            </Link>
            <span style={{ color: 'var(--color-text-faint)', fontSize: 12 }}>/</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{school.school_name}</span>
          </div>
          <h1 className="swa-page-title">Edit School</h1>
          <p className="swa-page-subtitle">{school.school_name} · {school.suburb}, {school.state}</p>
        </div>
        {school.school_url && (
          <a
            href={school.school_url}
            target="_blank"
            rel="noreferrer"
            className="swa-btn"
            style={{
              textDecoration: 'none',
              border: '1px solid var(--color-border)',
              background: 'var(--color-card)',
              color: 'var(--color-text-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>open_in_new</span>
            School website ↗
          </a>
        )}
      </div>

      <SchoolEditForm school={school} />
    </div>
  );
}
