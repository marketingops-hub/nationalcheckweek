import Link from 'next/link';
import SchoolsImportClient from '@/components/admin/SchoolsImportClient';

export default function SchoolsImportPage() {
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
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Import CSV</span>
          </div>
          <h1 className="swa-page-title">Import Schools CSV</h1>
          <p className="swa-page-subtitle">
            Upload a new ACARA School Profile CSV to upsert school data. Existing records are matched by ACARA SML ID.
          </p>
        </div>
      </div>
      <SchoolsImportClient />
    </div>
  );
}
