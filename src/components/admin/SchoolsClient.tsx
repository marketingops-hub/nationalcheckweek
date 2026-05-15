'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface SchoolRow {
  id: string;
  acara_sml_id: number | null;
  school_name: string;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  school_sector: string | null;
  school_type: string | null;
  year_range: string | null;
  geolocation: string | null;
  icsea: number | null;
  total_enrolments: number | null;
  created_at: string;
}

const STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];
const SECTORS = ['Government', 'Catholic', 'Independent'];
const TYPES = ['Primary', 'Secondary', 'Combined', 'Special'];

function sectorBadge(sector: string | null) {
  if (!sector) return 'swa-badge';
  if (sector === 'Government') return 'swa-badge swa-badge--primary';
  if (sector === 'Catholic') return 'swa-badge swa-badge--success';
  return 'swa-badge swa-badge--warning';
}

export default function SchoolsClient({
  schools: initialSchools,
  totalCount: initialCount,
}: {
  schools: SchoolRow[];
  totalCount: number;
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  // API-driven results — start with SSR data, update when filters change
  const [filtered, setFiltered] = useState<SchoolRow[]>(initialSchools);
  const [totalCount, setTotalCount] = useState(initialCount);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-query the API whenever search text or dropdowns change.
  // Type filter is client-only (not in API) so applied after fetch.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ limit: '200' });
        if (search.trim()) params.set('q', search.trim());
        if (stateFilter)  params.set('state', stateFilter);
        if (sectorFilter) params.set('sector', sectorFilter);
        const res = await fetch(`/api/admin/schools?${params}`);
        if (!res.ok) return;
        const json = await res.json();
        const rows: SchoolRow[] = json.data ?? [];
        // Apply type filter client-side (not supported by API)
        setFiltered(typeFilter ? rows.filter((s) => s.school_type === typeFilter) : rows);
        setTotalCount(json.count ?? rows.length);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, stateFilter, sectorFilter, typeFilter]);

  const stateCounts = STATES.map((st) => ({
    state: st,
    count: initialSchools.filter((s) => s.state === st).length,
  }));

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
      setDeleting(id);
      setDeleteError('');
      try {
        const res = await fetch(`/api/admin/schools/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error ?? 'Delete failed');
        }
        router.refresh();
      } catch (e) {
        setDeleteError(e instanceof Error ? e.message : 'Delete failed');
      } finally {
        setDeleting(null);
      }
    },
    [router]
  );

  return (
    <div>
      {/* Stat Cards */}
      <div className="swa-stat-grid" style={{ marginBottom: 24 }}>
        <div className="swa-stat-card">
          <div className="swa-stat-card__top">
            <span className="swa-stat-card__label">Total Schools</span>
            <span className="swa-badge swa-badge--primary">All</span>
          </div>
          <div className="swa-stat-card__value">{totalCount.toLocaleString()}</div>
          <div className="swa-stat-card__bottom">
            <span className="swa-stat-card__delta">Showing first {initialSchools.length}</span>
          </div>
        </div>

        <div className="swa-stat-card">
          <div className="swa-stat-card__top">
            <span className="swa-stat-card__label">States Covered</span>
            <span className="swa-badge swa-badge--success">Active</span>
          </div>
          <div className="swa-stat-card__value">
            {stateCounts.filter((s) => s.count > 0).length}
          </div>
          <div className="swa-stat-card__bottom">
            <span className="swa-stat-card__delta">
              {stateCounts
                .filter((s) => s.count > 0)
                .map((s) => s.state)
                .join(', ')}
            </span>
          </div>
        </div>

        <div className="swa-stat-card">
          <div className="swa-stat-card__top">
            <span className="swa-stat-card__label">Govt / Catholic / Indep</span>
            <span className="swa-badge swa-badge--warning">Sectors</span>
          </div>
          <div className="swa-stat-card__value" style={{ fontSize: 20 }}>
            {initialSchools.filter((s) => s.school_sector === 'Government').length} /{' '}
            {initialSchools.filter((s) => s.school_sector === 'Catholic').length} /{' '}
            {initialSchools.filter((s) => s.school_sector === 'Independent').length}
          </div>
          <div className="swa-stat-card__bottom">
            <span className="swa-stat-card__delta">From loaded records</span>
          </div>
        </div>
      </div>

      {deleteError && (
        <div className="swa-alert swa-alert--error" style={{ marginBottom: 16 }}>
          {deleteError}
        </div>
      )}

      {/* Filters bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <input
          className="swa-search"
          style={{ flex: '1 1 220px', minWidth: 180 }}
          placeholder="Search by name, suburb, postcode or ACARA ID…"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="swa-search"
          style={{ flex: '0 0 120px' }}
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
        >
          <option value="">All states</option>
          {STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          className="swa-search"
          style={{ flex: '0 0 140px' }}
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
        >
          <option value="">All sectors</option>
          {SECTORS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          className="swa-search"
          style={{ flex: '0 0 130px' }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <span style={{ fontSize: 13, color: 'var(--color-text-faint)', marginLeft: 4 }}>
          {searching ? 'Searching…' : `${filtered.length.toLocaleString()} shown`}
          {!searching && totalCount > filtered.length && (
            <> · <span style={{ color: 'var(--color-warning)' }}>{totalCount.toLocaleString()} total</span></>
          )}
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="swa-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 48, color: 'var(--color-text-faint)', marginBottom: 12, display: 'block' }}
          >
            search_off
          </span>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>
            No schools found
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Try adjusting your filters or search term.
          </div>
        </div>
      ) : (
        <div className="swa-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="swa-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th>School</th>
                <th>Location</th>
                <th>Sector / Type</th>
                <th>Year Range</th>
                <th style={{ textAlign: 'right' }}>ICSEA</th>
                <th style={{ textAlign: 'right' }}>Enrolments</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((school) => (
                <tr key={school.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--color-primary-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-primary)' }}>
                          school
                        </span>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 13 }}>
                          {school.school_name}
                        </div>
                        {school.acara_sml_id && (
                          <div style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>
                            ACARA #{school.acara_sml_id}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>
                      {school.suburb}
                      {school.state && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            color: 'var(--color-primary)',
                            background: 'var(--color-primary-light)',
                            borderRadius: 4,
                            padding: '1px 5px',
                          }}
                        >
                          {school.state}
                        </span>
                      )}
                    </div>
                    {school.postcode && (
                      <div style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>
                        {school.postcode}
                        {school.geolocation && ` · ${school.geolocation}`}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {school.school_sector && (
                        <span className={sectorBadge(school.school_sector)} style={{ width: 'fit-content' }}>
                          {school.school_sector}
                        </span>
                      )}
                      {school.school_type && (
                        <span style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>
                          {school.school_type}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                      {school.year_range ?? '—'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {school.icsea ?? '—'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                      {school.total_enrolments?.toLocaleString() ?? '—'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                      {school.acara_sml_id && (
                        <a
                          href={`/schools/${school.acara_sml_id}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: '5px 10px',
                            borderRadius: 'var(--radius-sm)',
                            textDecoration: 'none',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-muted)',
                            background: 'var(--color-card)',
                          }}
                        >
                          View ↗
                        </a>
                      )}
                      <Link
                        href={`/admin/schools/${school.id}`}
                        className="swa-btn swa-btn--primary"
                        style={{ fontSize: 12, padding: '5px 12px', textDecoration: 'none' }}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(school.id, school.school_name)}
                        disabled={deleting === school.id}
                        style={{
                          fontSize: 12,
                          padding: '5px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid #fca5a5',
                          color: '#dc2626',
                          background: '#fff1f1',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        {deleting === school.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!searching && totalCount > filtered.length && (
        <p style={{ fontSize: 12, color: 'var(--color-text-faint)', marginTop: 12, textAlign: 'center' }}>
          Showing {filtered.length} of {totalCount.toLocaleString()} schools. Refine the search or filters to narrow results.
        </p>
      )}
    </div>
  );
}
