'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SchoolProfile } from '@/types/school';

const STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];
const SECTORS = ['Government', 'Catholic', 'Independent'];
const TYPES = ['Primary', 'Secondary', 'Combined', 'Special'];
const GEOLOCATIONS = [
  'Major Cities',
  'Inner Regional',
  'Outer Regional',
  'Remote',
  'Very Remote',
];

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      {children}
      {hint && <span style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>{hint}</span>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-input-bg, #fff)',
  fontSize: 13,
  color: 'var(--color-text-primary)',
  boxSizing: 'border-box',
};

export default function SchoolEditForm({ school }: { school: SchoolProfile }) {
  const router = useRouter();
  const [form, setForm] = useState<SchoolProfile>({ ...school });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function setField<K extends keyof SchoolProfile>(key: K, value: SchoolProfile[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
  }

  function numField(key: keyof SchoolProfile) {
    return {
      value: form[key] ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        setField(key, (v === '' ? null : Number(v)) as SchoolProfile[typeof key]);
      },
    };
  }

  function strField(key: keyof SchoolProfile) {
    return {
      value: (form[key] as string) ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setField(key, (e.target.value || null) as SchoolProfile[typeof key]);
      },
    };
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch(`/api/admin/schools/${school.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Save failed');
      }
      setSuccess(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${school.school_name}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/schools/${school.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Delete failed');
      }
      setSaving(false);
      router.push('/admin/schools');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
      setSaving(false);
    }
  }

  const section = (title: string, icon: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 8 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-primary)' }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--color-border-light)' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {error && (
        <div className="swa-alert swa-alert--error">{error}</div>
      )}
      {success && (
        <div className="swa-alert swa-alert--success">Saved successfully.</div>
      )}

      {/* Identity */}
      <div className="swa-card">
        {section('School Identity', 'school')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          <Field label="School Name">
            <input style={inputStyle} {...strField('school_name')} />
          </Field>
          <Field label="ACARA SML ID" hint="Unique national identifier">
            <input style={inputStyle} type="number" {...numField('acara_sml_id')} />
          </Field>
          <Field label="Calendar Year">
            <input style={inputStyle} type="number" {...numField('calendar_year')} />
          </Field>
          <Field label="School URL">
            <input style={inputStyle} type="url" {...strField('school_url')} />
          </Field>
        </div>
      </div>

      {/* Location */}
      <div className="swa-card">
        {section('Location', 'location_on')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          <Field label="Suburb">
            <input style={inputStyle} {...strField('suburb')} />
          </Field>
          <Field label="State">
            <select style={inputStyle} {...strField('state')}>
              <option value="">— Select —</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Postcode">
            <input style={inputStyle} {...strField('postcode')} />
          </Field>
          <Field label="Geolocation">
            <select style={inputStyle} {...strField('geolocation')}>
              <option value="">— Select —</option>
              {GEOLOCATIONS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* Classification */}
      <div className="swa-card">
        {section('Classification', 'category')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          <Field label="Sector">
            <select style={inputStyle} {...strField('school_sector')}>
              <option value="">— Select —</option>
              {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Type">
            <select style={inputStyle} {...strField('school_type')}>
              <option value="">— Select —</option>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Year Range" hint="e.g. Prep-12">
            <input style={inputStyle} {...strField('year_range')} />
          </Field>
          <Field label="Governing Body">
            <input style={inputStyle} {...strField('governing_body')} />
          </Field>
          <Field label="Governing Body URL">
            <input style={inputStyle} type="url" {...strField('governing_body_url')} />
          </Field>
        </div>
      </div>

      {/* ICSEA */}
      <div className="swa-card">
        {section('ICSEA & SEA Quarters', 'bar_chart')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          <Field label="ICSEA" hint="Index of Community Socio-Educational Advantage">
            <input style={inputStyle} type="number" {...numField('icsea')} />
          </Field>
          <Field label="ICSEA Percentile">
            <input style={inputStyle} type="number" {...numField('icsea_percentile')} />
          </Field>
          <Field label="Bottom SEA Quarter (%)">
            <input style={inputStyle} type="number" step="0.1" {...numField('bottom_sea_quarter_pct')} />
          </Field>
          <Field label="Lower Middle SEA Quarter (%)">
            <input style={inputStyle} type="number" step="0.1" {...numField('lower_middle_sea_quarter_pct')} />
          </Field>
          <Field label="Upper Middle SEA Quarter (%)">
            <input style={inputStyle} type="number" step="0.1" {...numField('upper_middle_sea_quarter_pct')} />
          </Field>
          <Field label="Top SEA Quarter (%)">
            <input style={inputStyle} type="number" step="0.1" {...numField('top_sea_quarter_pct')} />
          </Field>
        </div>
      </div>

      {/* Staff */}
      <div className="swa-card">
        {section('Staff', 'people')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          <Field label="Teaching Staff">
            <input style={inputStyle} type="number" {...numField('teaching_staff')} />
          </Field>
          <Field label="FTE Teaching Staff">
            <input style={inputStyle} type="number" step="0.1" {...numField('fte_teaching_staff')} />
          </Field>
          <Field label="Non-Teaching Staff">
            <input style={inputStyle} type="number" {...numField('non_teaching_staff')} />
          </Field>
          <Field label="FTE Non-Teaching Staff">
            <input style={inputStyle} type="number" step="0.1" {...numField('fte_non_teaching_staff')} />
          </Field>
        </div>
      </div>

      {/* Enrolments */}
      <div className="swa-card">
        {section('Enrolments', 'groups')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          <Field label="Total Enrolments">
            <input style={inputStyle} type="number" {...numField('total_enrolments')} />
          </Field>
          <Field label="Girls Enrolments">
            <input style={inputStyle} type="number" {...numField('girls_enrolments')} />
          </Field>
          <Field label="Boys Enrolments">
            <input style={inputStyle} type="number" {...numField('boys_enrolments')} />
          </Field>
          <Field label="FTE Enrolments">
            <input style={inputStyle} type="number" step="0.1" {...numField('fte_enrolments')} />
          </Field>
          <Field label="Indigenous Enrolments (%)">
            <input style={inputStyle} type="number" step="0.1" {...numField('indigenous_enrolments_pct')} />
          </Field>
        </div>
      </div>

      {/* Language Background */}
      <div className="swa-card">
        {section('Language Background Other Than English', 'translate')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          <Field label="LBOTE Yes (%)">
            <input style={inputStyle} type="number" step="0.1" {...numField('lbote_yes_pct')} />
          </Field>
          <Field label="LBOTE No (%)">
            <input style={inputStyle} type="number" step="0.1" {...numField('lbote_no_pct')} />
          </Field>
          <Field label="LBOTE Not Stated (%)">
            <input style={inputStyle} type="number" step="0.1" {...numField('lbote_not_stated_pct')} />
          </Field>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 32 }}>
        <button
          onClick={handleDelete}
          disabled={saving}
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #fca5a5',
            color: '#dc2626',
            background: '#fff1f1',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Delete School
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => router.push('/admin/schools')}
            disabled={saving}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
              background: 'var(--color-card)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="swa-btn swa-btn--primary"
            style={{ padding: '10px 24px', fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
