import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminDashboard() {
  let userEmail = '';
  let issueCount = 0;
  let stateCount = 0;
  let areaCount = 0;
  let pageCount = 0;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userEmail = user?.email ?? '';
    const [issues, states, areas, pages] = await Promise.all([
      supabase.from('issues').select('id', { count: 'exact', head: true }),
      supabase.from('states').select('id', { count: 'exact', head: true }),
      supabase.from('areas').select('id', { count: 'exact', head: true }),
      supabase.from('pages').select('id', { count: 'exact', head: true }),
    ]);
    issueCount = issues.count ?? 0;
    stateCount = states.count ?? 0;
    areaCount = areas.count ?? 0;
    pageCount = pages.count ?? 0;
  } catch { /* middleware ensures auth, this is just for display */ }

  const stats = [
    { label: 'Issues', value: String(issueCount), sub: 'Wellbeing issues tracked', gradient: 'var(--admin-accent-gradient)', href: '/admin/issues' },
    { label: 'States', value: String(stateCount), sub: 'With priority data', gradient: 'linear-gradient(135deg, #22C55E, #4ADE80)', href: '/admin/states' },
    { label: 'Areas', value: String(areaCount), sub: 'LGAs and regions', gradient: 'linear-gradient(135deg, #A855F7, #C084FC)', href: '/admin/content' },
    { label: 'Pages', value: String(pageCount), sub: 'Custom CMS pages', gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)', href: '/admin/cms/pages' },
  ];

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-10">
        <h1 className="mb-2">Dashboard</h1>
        <p style={{ color: 'var(--admin-text-subtle)' }}>
          {userEmail ? (
            <span>Signed in as <span style={{ color: 'var(--admin-text-muted)' }}>{userEmail}</span></span>
          ) : 'Manage content and data for Schools Wellbeing Australia.'}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}
            className="admin-card relative overflow-hidden group block"
            style={{ padding: '24px', textDecoration: 'none' }}>
            <div className="text-3xl font-bold mb-2" style={{ color: 'var(--admin-text-primary)', letterSpacing: '-0.03em' }}>{stat.value}</div>
            <div className="text-sm font-semibold mb-0.5" style={{ color: 'var(--admin-text-secondary)' }}>{stat.label}</div>
            <div className="text-xs" style={{ color: 'var(--admin-text-subtle)' }}>{stat.sub}</div>
            <div className="absolute top-0 right-0 w-20 h-20 opacity-[0.07] rounded-bl-[40px] group-hover:opacity-[0.14] transition-opacity"
              style={{ background: stat.gradient }} />
            <svg className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--admin-text-subtle)' }}>
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        ))}
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick actions */}
        <div className="admin-card">
          <h2 className="mb-5">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { label: 'Manage Issues', href: '/admin/issues', desc: 'Edit wellbeing issue content', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
              { label: 'State Data', href: '/admin/states', desc: 'Update state-level statistics', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
              { label: 'Areas & Cities', href: '/admin/content', desc: 'Edit area reports and data', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
              { label: 'CMS Pages', href: '/admin/cms/pages', desc: 'Create and edit custom pages', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
            ].map((item) => (
              <a key={item.href} href={item.href}
                className="group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all"
                style={{ background: 'var(--admin-bg-elevated)', border: '1px solid var(--admin-border)' }}>
                <span style={{ color: 'var(--admin-text-faint)' }} className="group-hover:text-indigo-400 flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: 'var(--admin-text-primary)' }}>{item.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--admin-text-subtle)' }}>{item.desc}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 opacity-0 group-hover:opacity-100" style={{ color: 'var(--admin-text-subtle)' }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* System status */}
        <div className="admin-card">
          <h2 className="mb-5">System Status</h2>
          <div className="space-y-3">
            {[
              { label: 'Supabase Database', status: 'Connected', ok: true },
              { label: 'Authentication', status: 'Active', ok: true },
              { label: 'AI Integration', status: 'Not configured', ok: false },
              { label: 'Deployment', status: 'Live', ok: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--admin-border)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.ok ? 'var(--admin-success)' : 'var(--admin-danger)' }} />
                  <span className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>{item.label}</span>
                </div>
                <span className={`admin-badge ${item.ok ? 'admin-badge-green' : 'admin-badge-red'}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 text-xs" style={{ borderTop: '1px solid var(--admin-border)', color: 'var(--admin-text-faint)' }}>
            Configure an OpenAI API key in Settings to enable AI content generation.
          </div>
        </div>
      </div>
    </div>
  );
}
