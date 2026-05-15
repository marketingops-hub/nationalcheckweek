import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SchoolsClient from '@/components/admin/SchoolsClient';

export const dynamic = 'force-dynamic';

export default async function AdminSchoolsPage() {
  let schools: unknown[] = [];
  let totalCount = 0;
  let fetchError = '';

  try {
    const sb = await createClient();

    const { count } = await sb
      .from('school_profiles')
      .select('id', { count: 'exact', head: true });
    totalCount = count ?? 0;

    const { data, error } = await sb
      .from('school_profiles')
      .select('id, acara_sml_id, school_name, suburb, state, postcode, school_sector, school_type, year_range, geolocation, icsea, total_enrolments, created_at')
      .order('school_name')
      .limit(200);

    if (error) fetchError = error.message;
    schools = data ?? [];
  } catch (e) {
    fetchError = e instanceof Error ? e.message : 'Failed to load schools.';
  }

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Schools</h1>
          <p className="swa-page-subtitle">
            Manage the {totalCount.toLocaleString()} schools in the database — search, edit, or import a new CSV.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/admin/schools/import" className="swa-btn" style={{ textDecoration: 'none', border: '1px solid var(--color-border)', background: 'var(--color-card)', color: 'var(--color-text-primary)', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload_file</span>
            Import CSV
          </Link>
        </div>
      </div>

      {fetchError && (
        <div className="swa-alert swa-alert--error" style={{ marginBottom: 24 }}>{fetchError}</div>
      )}

      <SchoolsClient schools={schools as never[]} totalCount={totalCount} />
    </div>
  );
}
