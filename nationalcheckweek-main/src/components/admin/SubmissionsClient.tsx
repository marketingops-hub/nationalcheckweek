'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ApplicationRow, NominationRow,
  APP_STATUSES, NOM_STATUSES, STATUS_COLORS,
  type Application, type Nomination,
} from '@/components/admin/SubmissionRow';

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
          <button key={t} onClick={() => {
            setTab(t);
            const validStatuses = t === 'applications' ? APP_STATUSES : NOM_STATUSES;
            if (filterStatus && !(validStatuses as readonly string[]).includes(filterStatus)) setFilterStatus('');
          }}
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
