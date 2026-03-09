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
  } catch { /* middleware ensures auth */ }

  const QUICK_ACTIONS = [
    { label: 'Manage Issues',  href: '/admin/issues',      ms: 'warning',      desc: 'Edit wellbeing issue content' },
    { label: 'State Data',     href: '/admin/states',      ms: 'analytics',    desc: 'Update state-level statistics' },
    { label: 'Areas & Cities', href: '/admin/content',     ms: 'location_on',  desc: 'Edit area reports and data' },
    { label: 'CMS Pages',      href: '/admin/cms/pages',   ms: 'article',      desc: 'Create and edit custom pages' },
    { label: 'API Keys',       href: '/admin/api',         ms: 'key',          desc: 'Manage integration keys' },
    { label: 'Settings',       href: '/admin/settings',    ms: 'settings',     desc: 'Configure system preferences' },
  ];

  const cardStyle = {
    background: '#fff',
    border: '1px solid var(--admin-border)',
    borderRadius: 'var(--admin-radius-lg)',
    boxShadow: 'var(--admin-shadow-card)',
  };
  const metricTileStyle = {
    padding: 16,
    borderRadius: 'var(--admin-radius-md)',
    background: 'var(--admin-bg-elevated)',
    border: '1px solid var(--admin-border)',
  };

  return (
    <>
      {/* Stat cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Issues */}
        <Link href="/admin/issues" className="block p-6" style={cardStyle}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--admin-text-subtle)' }}>Wellbeing Issues</p>
              <h3 className="text-3xl font-bold mt-1" style={{ color: 'var(--admin-text-primary)' }}>{issueCount}</h3>
            </div>
            <span className="admin-badge admin-badge-green">Active</span>
          </div>
          <div className="h-12 w-full">
            <svg className="w-full h-full" viewBox="0 0 100 20">
              <defs>
                <linearGradient id="grad-issues" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" style={{stopColor:'rgba(89,37,244,0.2)',stopOpacity:1}}/>
                  <stop offset="100%" style={{stopColor:'rgba(89,37,244,0)',stopOpacity:1}}/>
                </linearGradient>
              </defs>
              <path d="M0 15 Q 10 5, 20 18 T 40 10 T 60 15 T 80 5 T 100 12" fill="none" stroke="#5925f4" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
              <path d="M0 15 Q 10 5, 20 18 T 40 10 T 60 15 T 80 5 T 100 12 V 20 H 0 Z" fill="url(#grad-issues)"/>
            </svg>
          </div>
        </Link>

        {/* States */}
        <Link href="/admin/states" className="block p-6" style={cardStyle}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--admin-text-subtle)' }}>States & Territories</p>
              <h3 className="text-3xl font-bold mt-1" style={{ color: 'var(--admin-text-primary)' }}>{stateCount}</h3>
            </div>
            <span className="admin-badge admin-badge-green">All active</span>
          </div>
          <div className="h-12 w-full">
            <svg className="w-full h-full" viewBox="0 0 100 20">
              <defs>
                <linearGradient id="grad-states" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" style={{stopColor:'rgba(89,37,244,0.2)',stopOpacity:1}}/>
                  <stop offset="100%" style={{stopColor:'rgba(89,37,244,0)',stopOpacity:1}}/>
                </linearGradient>
              </defs>
              <path d="M0 18 Q 20 15, 40 12 T 60 8 T 80 15 T 100 5" fill="none" stroke="#5925f4" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
              <path d="M0 18 Q 20 15, 40 12 T 60 8 T 80 15 T 100 5 V 20 H 0 Z" fill="url(#grad-states)"/>
            </svg>
          </div>
        </Link>

        {/* Areas */}
        <Link href="/admin/content" className="block p-6" style={cardStyle}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--admin-text-subtle)' }}>Areas & Cities</p>
              <h3 className="text-3xl font-bold mt-1" style={{ color: 'var(--admin-text-primary)' }}>{areaCount}</h3>
            </div>
            <span className="admin-badge admin-badge-red">{pageCount} pages</span>
          </div>
          <div className="h-12 w-full">
            <svg className="w-full h-full" viewBox="0 0 100 20">
              <path d="M0 5 Q 20 10, 40 5 T 60 15 T 80 12 T 100 18" fill="none" stroke="#f43f5e" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
              <path d="M0 5 Q 20 10, 40 5 T 60 15 T 80 12 T 100 18 V 20 H 0 Z" fill="rgba(244,63,94,0.1)"/>
            </svg>
          </div>
        </Link>
      </section>

      {/* Main 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left col */}
        <div className="lg:col-span-2 space-y-8">

          {/* System Health */}
          <div className="overflow-hidden" style={{ ...cardStyle, padding: 0 }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--admin-border)' }}>
              <h3 className="font-semibold" style={{ fontSize: '0.9375rem', color: 'var(--admin-text-primary)' }}>System Health</h3>
              <button aria-label="Refresh system health" className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--admin-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Refresh <span aria-hidden="true" className="material-symbols-outlined text-[18px]">sync</span>
              </button>
            </div>
            <div className="p-6 flex flex-col md:flex-row items-center gap-10">
              <div className="relative size-44 flex-shrink-0">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  <path style={{ stroke: 'var(--admin-border)' }} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray="100, 100" strokeLinecap="round" strokeWidth="3"/>
                  <path stroke="#5925f4" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray="84, 100" strokeLinecap="round" strokeWidth="3"/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-bold" style={{ color: 'var(--admin-text-primary)' }}>84%</span>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--admin-text-subtle)' }}>Optimal</span>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                <div style={metricTileStyle}>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--admin-text-subtle)' }}>Supabase DB</p>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: 'var(--admin-border)' }}>
                      <div className="h-full w-full" style={{ background: 'var(--admin-success)' }}></div>
                    </div>
                    <span className="text-xs font-bold" style={{ color: 'var(--admin-success)' }}>OK</span>
                  </div>
                </div>
                <div style={metricTileStyle}>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--admin-text-subtle)' }}>Auth</p>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: 'var(--admin-border)' }}>
                      <div className="h-full w-full" style={{ background: 'var(--admin-accent)' }}></div>
                    </div>
                    <span className="text-xs font-bold" style={{ color: 'var(--admin-accent)' }}>Active</span>
                  </div>
                </div>
                <div style={metricTileStyle}>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--admin-text-subtle)' }}>AI Integration</p>
                  <p className="text-sm font-bold mt-1" style={{ color: 'var(--admin-warning-light)' }}>Not set</p>
                </div>
                <div style={metricTileStyle}>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--admin-text-subtle)' }}>Deployment</p>
                  <p className="text-sm font-bold mt-1" style={{ color: 'var(--admin-success)' }}>Live</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--admin-border)' }}>
              <h3 className="font-semibold" style={{ fontSize: '0.9375rem', color: 'var(--admin-text-primary)' }}>Recent Activity</h3>
              <button className="text-sm font-medium" style={{ color: 'var(--admin-text-subtle)', background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
            </div>
            <div>
              {[
                { icon: 'article',     bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', title: 'Issue published:',    body: 'New wellbeing issue went live.',          time: '2 minutes ago' },
                { icon: 'analytics',   bg: 'rgba(16,185,129,0.1)', color: '#10b981', title: 'State data updated:', body: 'Victoria statistics refreshed.',           time: '45 minutes ago' },
                { icon: 'location_on', bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', title: 'New area added:',     body: 'Northern Beaches (NSW) created.',          time: '1 hour ago' },
                { icon: 'update',      bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6', title: 'CMS page edited:',    body: 'About page content updated.',              time: '3 hours ago' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-[var(--admin-bg-elevated)]"
                  style={{ borderBottom: i < 3 ? '1px solid var(--admin-border)' : 'none' }}
                >
                  <div className="size-10 rounded-full flex items-center justify-center shrink-0" style={{ background: item.bg, color: item.color }}>
                    <span aria-hidden="true" className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: 'var(--admin-text-secondary)' }}>
                      <span className="font-semibold" style={{ color: 'var(--admin-text-primary)' }}>{item.title}</span> {item.body}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--admin-text-faint)' }}>{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-8">

          {/* Quick Actions */}
          <div style={{ ...cardStyle, padding: 24 }}>
            <h3 className="font-semibold mb-5" style={{ fontSize: '0.9375rem', color: 'var(--admin-text-primary)' }}>Quick Actions</h3>
            <div className="space-y-2">
              {QUICK_ACTIONS.map((item) => (
                <Link key={item.href} href={item.href}
                  className="w-full flex items-center justify-between p-3 rounded-xl group transition-all hover:bg-[var(--admin-accent-bg)]"
                  style={{ border: '1px solid var(--admin-border)', textDecoration: 'none' }}
                >
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="material-symbols-outlined" style={{ color: 'var(--admin-accent)', fontSize: 20 }}>{item.ms}</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--admin-text-secondary)' }}>{item.label}</span>
                  </div>
                  <span aria-hidden="true" className="material-symbols-outlined" style={{ color: 'var(--admin-text-faint)', fontSize: 18 }}>chevron_right</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Welcome / promo card */}
          <div className="rounded-xl p-6 text-white relative overflow-hidden" style={{ background: 'var(--admin-accent-gradient)', boxShadow: '0 8px 24px rgba(89,37,244,0.25)' }}>
            <div className="relative z-10">
              <h4 className="text-base font-bold mb-2">
                {userEmail ? <>Welcome, {userEmail.split('@')[0]}!</> : 'Pro Features'}
              </h4>
              <p className="text-sm mb-4" style={{ opacity: 0.88 }}>
                {userEmail
                  ? 'Keep content fresh to improve site rankings and user trust.'
                  : 'Get unlimited access to advanced analytics modules.'}
              </p>
              <Link href="/admin/issues"
                className="w-full block text-center py-2 font-bold rounded-lg text-sm transition-opacity hover:opacity-90"
                style={{ background: '#fff', color: 'var(--admin-accent)' }}>
                Manage Issues
              </Link>
            </div>
            <span aria-hidden="true" className="material-symbols-outlined absolute -bottom-4 -right-4 pointer-events-none select-none" style={{ color: 'rgba(255,255,255,0.08)', fontSize: 120 }}>workspace_premium</span>
          </div>
        </div>
      </div>
    </>
  );
}
