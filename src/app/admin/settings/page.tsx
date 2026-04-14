'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const LABEL: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: 'var(--color-text-faint)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 14 };
const ROW: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border)' };
const ROW_LAST: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' };
const KEY: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' };
const VAL: React.CSSProperties = { fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'monospace' };

type Settings = {
  site_name: string;
  contact_email: string;
  footer_tagline: string;
  maintenance_mode: string;
};

const DEFAULTS: Settings = {
  site_name: 'National Check-in Week',
  contact_email: '',
  footer_tagline: 'Supporting student wellbeing across Australia.',
  maintenance_mode: 'false',
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [original, setOriginal] = useState<Settings>(DEFAULTS);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then((d: Partial<Settings>) => {
        const merged = { ...DEFAULTS, ...d };
        setSettings(merged);
        setOriginal(merged);
      })
      .catch(() => setError('Could not load settings — table may not exist yet. Run supabase/site_settings.sql to create it.'))
      .finally(() => setLoading(false));
  }, []);

  const isDirty = JSON.stringify(settings) !== JSON.stringify(original);

  async function handleSave() {
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Save failed');
      setOriginal(settings);
      setSuccess('Settings saved successfully.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const set = (k: keyof Settings, v: string) => {
    setSettings(p => ({ ...p, [k]: v }));
    setSuccess('');
  };

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Settings</h1>
          <p className="swa-page-subtitle">Site configuration, environment status and integrations</p>
        </div>
        {isDirty && (
          <button onClick={handleSave} disabled={saving} className="swa-btn swa-btn--primary"
            style={{ opacity: saving ? 0.6 : 1 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {saving ? 'hourglass_empty' : 'save'}
            </span>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        )}
      </div>

      {error   && <div className="swa-alert swa-alert--error"   style={{ marginBottom: 20 }}>{error}</div>}
      {success && <div className="swa-alert swa-alert--success" style={{ marginBottom: 20 }}>{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* ── Editable site settings ── */}
        <div className="swa-card" style={{ gridColumn: '1 / -1' }}>
          <div style={LABEL}>Site Configuration</div>
          {loading ? (
            <div style={{ color: 'var(--color-text-faint)', fontSize: 13, padding: '12px 0' }}>Loading…</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label className="swa-form-label">Site Name</label>
                <input className="swa-form-input" value={settings.site_name}
                  onChange={e => set('site_name', e.target.value)}
                  placeholder="National Check-in Week" />
              </div>
              <div>
                <label className="swa-form-label">Contact Email</label>
                <input className="swa-form-input" type="email" value={settings.contact_email}
                  onChange={e => set('contact_email', e.target.value)}
                  placeholder="hello@example.com.au" />
              </div>
              <div>
                <label className="swa-form-label">Footer Tagline</label>
                <input className="swa-form-input" value={settings.footer_tagline}
                  onChange={e => set('footer_tagline', e.target.value)}
                  placeholder="Supporting student wellbeing…" />
              </div>
              <div>
                <label className="swa-form-label">Maintenance Mode</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                  <button type="button"
                    onClick={() => set('maintenance_mode', settings.maintenance_mode === 'true' ? 'false' : 'true')}
                    className={`swa-toggle ${settings.maintenance_mode === 'true' ? 'on' : ''}`} />
                  <span style={{ fontSize: 13, fontWeight: 500,
                    color: settings.maintenance_mode === 'true' ? '#DC2626' : 'var(--color-text-faint)' }}>
                    {settings.maintenance_mode === 'true' ? 'Enabled — site shows maintenance page' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Environment ── */}
        <div className="swa-card">
          <div style={{ marginBottom: 28 }}>
            <div style={LABEL}>Environment Variables</div>
            <div style={ROW}>
              <span style={KEY}>NEXT_PUBLIC_SUPABASE_URL</span>
              <span style={{ ...VAL, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '—').replace('https://', '').split('.')[0]}…
              </span>
            </div>
            <div style={ROW}>
              <span style={KEY}>SUPABASE_SERVICE_ROLE_KEY</span>
              <span className={`swa-badge ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'swa-badge--success' : 'swa-badge--error'}`}>
                {process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'}
              </span>
            </div>
            <div style={ROW_LAST}>
              <span style={KEY}>NODE_ENV</span>
              <span style={VAL}>{process.env.NODE_ENV ?? '—'}</span>
            </div>
          </div>
        </div>

        {/* ── Integrations ── */}
        <div className="swa-card">
          <div style={LABEL}>Integrations &amp; Data</div>
          <div style={ROW}>
            <div>
              <div style={KEY}>API Keys</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-faint)', marginTop: 2 }}>Stored in Supabase api_keys table</div>
            </div>
            <Link href="/admin/api" className="swa-btn swa-btn--ghost" style={{ fontSize: 12, padding: '4px 10px', textDecoration: 'none' }}>Manage →</Link>
          </div>
          <div style={ROW}>
            <div>
              <div style={KEY}>AI Prompt Templates</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-faint)', marginTop: 2 }}>State &amp; area generation prompts</div>
            </div>
            <Link href="/admin/prompts" className="swa-btn swa-btn--ghost" style={{ fontSize: 12, padding: '4px 10px', textDecoration: 'none' }}>Manage →</Link>
          </div>
          <div style={ROW_LAST}>
            <div>
              <div style={KEY}>User Management</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-faint)', marginTop: 2 }}>Admin accounts via Supabase Auth</div>
            </div>
            <Link href="/admin/users" className="swa-btn swa-btn--ghost" style={{ fontSize: 12, padding: '4px 10px', textDecoration: 'none' }}>Manage →</Link>
          </div>
        </div>

        {/* ── Quick links ── */}
        <div className="swa-card">
          <div style={LABEL}>Site Links</div>
          {[
            { label: 'Homepage',       href: '/',            ms: 'home' },
            { label: 'Events listing', href: '/events',      ms: 'event' },
            { label: 'FAQ page',       href: '/faq',         ms: 'help' },
            { label: 'Partners page',  href: '/partners',    ms: 'handshake' },
            { label: 'Sitemap.xml',    href: '/sitemap.xml', ms: 'map' },
            { label: 'Robots.txt',     href: '/robots.txt',  ms: 'smart_toy' },
          ].map(l => (
            <div key={l.href} style={ROW}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-text-faint)' }}>{l.ms}</span>
                <span style={KEY}>{l.label}</span>
              </div>
              <a href={l.href} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                Open ↗
              </a>
            </div>
          ))}
        </div>

        {/* ── Build info ── */}
        <div className="swa-card">
          <div style={LABEL}>Build Information</div>
          <div style={ROW}><span style={KEY}>Framework</span><span style={VAL}>Next.js (App Router)</span></div>
          <div style={ROW}><span style={KEY}>Database</span><span style={VAL}>Supabase (PostgreSQL)</span></div>
          <div style={ROW}><span style={KEY}>Hosting</span><span style={VAL}>Vercel</span></div>
          <div style={ROW}><span style={KEY}>Auth</span><span style={VAL}>Supabase Auth</span></div>
          <div style={ROW_LAST}><span style={KEY}>AI</span><span style={VAL}>OpenAI GPT-4o-mini</span></div>
        </div>

      </div>
    </div>
  );
}
