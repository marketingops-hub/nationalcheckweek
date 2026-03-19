'use client';

import { useCallback, useEffect, useState } from 'react';

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface Application {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  organisation: string | null;
  role_title: string | null;
  state: string | null;
  category_id: string | null;
  ambassador_categories: Category | null;
  why_ambassador: string;
  experience: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface Nomination {
  id: string;
  nominee_first_name: string;
  nominee_last_name: string;
  nominee_email: string | null;
  nominee_phone: string | null;
  nominee_organisation: string | null;
  nominee_role_title: string | null;
  nominee_state: string | null;
  category_id: string | null;
  ambassador_categories: Category | null;
  reason: string;
  nominee_linkedin: string | null;
  nominator_name: string;
  nominator_email: string;
  nominator_phone: string | null;
  nominator_relation: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const APP_STATUSES = ['new', 'reviewing', 'approved', 'declined'];
const NOM_STATUSES = ['new', 'reviewing', 'contacted', 'approved', 'declined'];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  new:       { bg: '#EFF6FF', color: '#1D4ED8' },
  reviewing: { bg: '#FEF3C7', color: '#B45309' },
  contacted: { bg: '#F0FDF4', color: '#15803D' },
  approved:  { bg: '#DCFCE7', color: '#15803D' },
  declined:  { bg: '#FEE2E2', color: '#B91C1C' },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? { bg: '#F3F4F6', color: '#6B7280' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

function ApplicationRow({ item, onUpdate, onDelete }: { item: Application; onUpdate: (id: string, patch: Partial<Application>) => void; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(item.admin_notes ?? '');
  const [saving, setSaving] = useState(false);
  const cat = item.ambassador_categories;

  async function saveNotes() {
    setSaving(true);
    const res = await fetch(`/api/admin/submissions/${item.id}?type=applications`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_notes: notes }),
    });
    if (res.ok) onUpdate(item.id, { admin_notes: notes });
    setSaving(false);
  }

  async function setStatus(status: string) {
    const res = await fetch(`/api/admin/submissions/${item.id}?type=applications`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) onUpdate(item.id, { status });
  }

  async function del() {
    if (!confirm(`Delete application from ${item.first_name} ${item.last_name}?`)) return;
    const res = await fetch(`/api/admin/submissions/${item.id}?type=applications`, { method: 'DELETE' });
    if (res.ok) onDelete(item.id);
  }

  return (
    <div style={{ borderBottom: '1px solid var(--color-border)' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', background: expanded ? 'var(--color-primary-pale)' : 'transparent' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>
            {item.first_name} {item.last_name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-faint)', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
            <span>{item.email}</span>
            {item.organisation && <span>· {item.organisation}</span>}
            {item.role_title && <span>· {item.role_title}</span>}
            {item.state && <span>· {item.state}</span>}
          </div>
        </div>
        {cat && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: cat.color + '18', color: cat.color, border: `1px solid ${cat.color}33`, whiteSpace: 'nowrap' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{cat.icon}</span>
            {cat.name}
          </span>
        )}
        <StatusBadge status={item.status} />
        <span style={{ fontSize: 11, color: 'var(--color-text-faint)', whiteSpace: 'nowrap' }}>{timeAgo(item.created_at)}</span>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-text-faint)' }}>{expanded ? 'expand_less' : 'expand_more'}</span>
      </div>

      {expanded && (
        <div style={{ padding: '16px 20px', background: 'var(--color-primary-pale)', borderTop: '1px solid var(--color-border-light)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-faint)', marginBottom: 6 }}>Why they want to be an Ambassador</div>
              <p style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.75, margin: 0 }}>{item.why_ambassador}</p>
            </div>
            {item.experience && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-faint)', marginBottom: 6 }}>Experience</div>
                <p style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.75, margin: 0 }}>{item.experience}</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {item.phone && <a href={`tel:${item.phone}`} style={{ fontSize: 12, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>📞 {item.phone}</a>}
            {item.linkedin_url && <a href={item.linkedin_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>🔗 LinkedIn</a>}
            {item.website_url && <a href={item.website_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>🌐 Website</a>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-faint)', marginBottom: 6 }}>Admin Notes</div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
                placeholder="Internal notes..."
              />
            </div>
            <button onClick={saveNotes} disabled={saving} className="swa-btn" style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, border: '1px solid var(--color-border)', background: 'var(--color-card)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {saving ? 'Saving…' : 'Save Notes'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-faint)', fontWeight: 600, marginRight: 4 }}>Set status:</span>
              {APP_STATUSES.map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1px solid ${item.status === s ? (STATUS_COLORS[s]?.color ?? '#ccc') : 'var(--color-border)'}`, background: item.status === s ? (STATUS_COLORS[s]?.bg ?? '#f3f4f6') : 'var(--color-card)', color: item.status === s ? (STATUS_COLORS[s]?.color ?? '#333') : 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                  {s}
                </button>
              ))}
            </div>
            <button onClick={del} style={{ fontSize: 12, color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

function NominationRow({ item, onUpdate, onDelete }: { item: Nomination; onUpdate: (id: string, patch: Partial<Nomination>) => void; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(item.admin_notes ?? '');
  const [saving, setSaving] = useState(false);
  const cat = item.ambassador_categories;

  async function saveNotes() {
    setSaving(true);
    const res = await fetch(`/api/admin/submissions/${item.id}?type=nominations`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_notes: notes }),
    });
    if (res.ok) onUpdate(item.id, { admin_notes: notes });
    setSaving(false);
  }

  async function setStatus(status: string) {
    const res = await fetch(`/api/admin/submissions/${item.id}?type=nominations`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) onUpdate(item.id, { status });
  }

  async function del() {
    if (!confirm(`Delete nomination of ${item.nominee_first_name} ${item.nominee_last_name}?`)) return;
    const res = await fetch(`/api/admin/submissions/${item.id}?type=nominations`, { method: 'DELETE' });
    if (res.ok) onDelete(item.id);
  }

  return (
    <div style={{ borderBottom: '1px solid var(--color-border)' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', background: expanded ? 'var(--color-primary-pale)' : 'transparent' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>
            {item.nominee_first_name} {item.nominee_last_name}
            <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--color-text-faint)', marginLeft: 8 }}>nominated by {item.nominator_name}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-faint)', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
            {item.nominee_organisation && <span>{item.nominee_organisation}</span>}
            {item.nominee_role_title && <span>· {item.nominee_role_title}</span>}
            {item.nominee_state && <span>· {item.nominee_state}</span>}
          </div>
        </div>
        {cat && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: cat.color + '18', color: cat.color, border: `1px solid ${cat.color}33`, whiteSpace: 'nowrap' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{cat.icon}</span>
            {cat.name}
          </span>
        )}
        <StatusBadge status={item.status} />
        <span style={{ fontSize: 11, color: 'var(--color-text-faint)', whiteSpace: 'nowrap' }}>{timeAgo(item.created_at)}</span>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-text-faint)' }}>{expanded ? 'expand_less' : 'expand_more'}</span>
      </div>

      {expanded && (
        <div style={{ padding: '16px 20px', background: 'var(--color-primary-pale)', borderTop: '1px solid var(--color-border-light)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-faint)', marginBottom: 6 }}>Reason for Nomination</div>
              <p style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.75, margin: 0 }}>{item.reason}</p>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-faint)', marginBottom: 8 }}>Nominee Contact</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.9 }}>
                {item.nominee_email && <div>📧 <a href={`mailto:${item.nominee_email}`} style={{ color: 'var(--color-primary)' }}>{item.nominee_email}</a></div>}
                {item.nominee_phone && <div>📞 {item.nominee_phone}</div>}
                {item.nominee_linkedin && <div>🔗 <a href={item.nominee_linkedin} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>LinkedIn</a></div>}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-faint)', marginBottom: 8, marginTop: 12 }}>Nominator</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.9 }}>
                <div>{item.nominator_name} {item.nominator_relation && <span style={{ color: 'var(--color-text-faint)' }}>({item.nominator_relation})</span>}</div>
                <div>📧 <a href={`mailto:${item.nominator_email}`} style={{ color: 'var(--color-primary)' }}>{item.nominator_email}</a></div>
                {item.nominator_phone && <div>📞 {item.nominator_phone}</div>}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-faint)', marginBottom: 6 }}>Admin Notes</div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
                placeholder="Internal notes..."
              />
            </div>
            <button onClick={saveNotes} disabled={saving} className="swa-btn" style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, border: '1px solid var(--color-border)', background: 'var(--color-card)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {saving ? 'Saving…' : 'Save Notes'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-faint)', fontWeight: 600, marginRight: 4 }}>Set status:</span>
              {NOM_STATUSES.map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1px solid ${item.status === s ? (STATUS_COLORS[s]?.color ?? '#ccc') : 'var(--color-border)'}`, background: item.status === s ? (STATUS_COLORS[s]?.bg ?? '#f3f4f6') : 'var(--color-card)', color: item.status === s ? (STATUS_COLORS[s]?.color ?? '#333') : 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                  {s}
                </button>
              ))}
            </div>
            <button onClick={del} style={{ fontSize: 12, color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubmissionsClient() {
  const [tab, setTab] = useState<'applications' | 'nominations'>('applications');
  const [applications, setApplications] = useState<Application[]>([]);
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [appRes, nomRes] = await Promise.all([
        fetch('/api/admin/submissions?type=applications'),
        fetch('/api/admin/submissions?type=nominations'),
      ]);
      const appData = await appRes.json();
      const nomData = await nomRes.json();
      setApplications(appData.data ?? []);
      setNominations(nomData.data ?? []);
    } catch {
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function updateApp(id: string, patch: Partial<Application>) {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  }
  function deleteApp(id: string) {
    setApplications(prev => prev.filter(a => a.id !== id));
  }
  function updateNom(id: string, patch: Partial<Nomination>) {
    setNominations(prev => prev.map(n => n.id === id ? { ...n, ...patch } : n));
  }
  function deleteNom(id: string) {
    setNominations(prev => prev.filter(n => n.id !== id));
  }

  const filteredApps = filterStatus ? applications.filter(a => a.status === filterStatus) : applications;
  const filteredNoms = filterStatus ? nominations.filter(n => n.status === filterStatus) : nominations;

  const newApps = applications.filter(a => a.status === 'new').length;
  const newNoms = nominations.filter(n => n.status === 'new').length;

  return (
    <>
      <div className="swa-page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Submissions</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-faint)', margin: '2px 0 0' }}>
            Ambassador applications and nominations from the public
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/apply" target="_blank" rel="noreferrer" className="swa-btn" style={{ textDecoration: 'none', border: '1px solid var(--color-border)', background: 'var(--color-card)', color: 'var(--color-text-body)', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span> Apply page
          </a>
          <a href="/nominate" target="_blank" rel="noreferrer" className="swa-btn" style={{ textDecoration: 'none', border: '1px solid var(--color-border)', background: 'var(--color-card)', color: 'var(--color-text-body)', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span> Nominate page
          </a>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Applications', value: applications.length, color: '#2563eb' },
          { label: 'New Applications', value: newApps, color: '#d97706', alert: newApps > 0 },
          { label: 'Total Nominations', value: nominations.length, color: '#7c3aed' },
          { label: 'New Nominations', value: newNoms, color: '#d97706', alert: newNoms > 0 },
        ].map(stat => (
          <div key={stat.label} className="swa-card" style={{ textAlign: 'center', padding: '16px 12px', border: stat.alert ? `1px solid ${stat.color}44` : undefined, background: stat.alert ? stat.color + '08' : undefined }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-faint)', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--color-border)', marginBottom: 20 }}>
        {(['applications', 'nominations'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setFilterStatus(''); }}
            style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent', marginBottom: -2, color: tab === t ? 'var(--color-primary)' : 'var(--color-text-muted)', textTransform: 'capitalize' }}>
            {t === 'applications' ? (
              <><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 5 }}>person_add</span>
                Applications {newApps > 0 && <span style={{ marginLeft: 6, background: '#EF4444', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 800 }}>{newApps} new</span>}
              </>
            ) : (
              <><span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 5 }}>star</span>
                Nominations {newNoms > 0 && <span style={{ marginLeft: 6, background: '#EF4444', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 800 }}>{newNoms} new</span>}
              </>
            )}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button onClick={() => setFilterStatus('')}
          style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: `1px solid ${!filterStatus ? 'var(--color-primary)' : 'var(--color-border)'}`, background: !filterStatus ? 'var(--color-primary-light)' : 'var(--color-card)', color: !filterStatus ? 'var(--color-primary)' : 'var(--color-text-muted)', cursor: 'pointer' }}>
          All
        </button>
        {(tab === 'applications' ? APP_STATUSES : NOM_STATUSES).map(s => {
          const c = STATUS_COLORS[s];
          const isActive = filterStatus === s;
          return (
            <button key={s} onClick={() => setFilterStatus(isActive ? '' : s)}
              style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1px solid ${isActive ? c.color : 'var(--color-border)'}`, background: isActive ? c.bg : 'var(--color-card)', color: isActive ? c.color : 'var(--color-text-muted)', textTransform: 'capitalize' }}>
              {s}
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--color-error)', fontSize: 13 }}>{error}</div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-faint)' }}>Loading...</div>}

      {!loading && tab === 'applications' && (
        filteredApps.length === 0 ? (
          <div className="swa-card" style={{ textAlign: 'center', padding: 48 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-text-faint)', display: 'block', marginBottom: 8 }}>person_add</span>
            <p style={{ color: 'var(--color-text-faint)', margin: 0 }}>{filterStatus ? 'No applications with this status.' : 'No applications yet.'}</p>
          </div>
        ) : (
          <div className="swa-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-faint)' }}>
              <div style={{ flex: 1 }}>Applicant</div>
              <span>Category</span>
              <span style={{ width: 80 }}>Status</span>
              <span style={{ width: 60 }}>Time</span>
              <span style={{ width: 20 }}></span>
            </div>
            {filteredApps.map(a => <ApplicationRow key={a.id} item={a} onUpdate={updateApp} onDelete={deleteApp} />)}
          </div>
        )
      )}

      {!loading && tab === 'nominations' && (
        filteredNoms.length === 0 ? (
          <div className="swa-card" style={{ textAlign: 'center', padding: 48 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-text-faint)', display: 'block', marginBottom: 8 }}>star</span>
            <p style={{ color: 'var(--color-text-faint)', margin: 0 }}>{filterStatus ? 'No nominations with this status.' : 'No nominations yet.'}</p>
          </div>
        ) : (
          <div className="swa-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-faint)' }}>
              <div style={{ flex: 1 }}>Nominee</div>
              <span>Category</span>
              <span style={{ width: 80 }}>Status</span>
              <span style={{ width: 60 }}>Time</span>
              <span style={{ width: 20 }}></span>
            </div>
            {filteredNoms.map(n => <NominationRow key={n.id} item={n} onUpdate={updateNom} onDelete={deleteNom} />)}
          </div>
        )
      )}

      {!loading && (
        <div style={{ marginTop: 16, fontSize: 12, color: 'var(--color-text-faint)' }}>
          {tab === 'applications' ? `${filteredApps.length} of ${applications.length} applications` : `${filteredNoms.length} of ${nominations.length} nominations`}
        </div>
      )}
    </>
  );
}
