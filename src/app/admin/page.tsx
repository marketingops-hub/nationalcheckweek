import { createClient } from '@/lib/supabase/server';

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
    { label: 'Issues Tracked', value: String(issueCount), change: 'Wellbeing issues', color: '#1C7ED6' },
    { label: 'States & Territories', value: String(stateCount), change: 'With priority data', color: '#2DA44E' },
    { label: 'Areas / Cities', value: String(areaCount), change: 'LGAs and regions', color: '#9B59B6' },
    { label: 'CMS Pages', value: String(pageCount), change: 'Custom pages', color: '#E67E22' },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold mb-1" style={{ color: '#E6EDF3' }}>
          Dashboard
        </h1>
        <p className="text-sm" style={{ color: '#6E7681' }}>
          Welcome back, {userEmail}. Manage content and data for Schools Wellbeing Australia.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-5"
            style={{ background: '#161B22', border: '1px solid #21262D' }}
          >
            <div className="text-2xl font-bold mb-1" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-sm font-medium mb-0.5" style={{ color: '#C9D1D9' }}>
              {stat.label}
            </div>
            <div className="text-xs" style={{ color: '#484F58' }}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick links */}
        <div
          className="rounded-xl p-6"
          style={{ background: '#161B22', border: '1px solid #21262D' }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#C9D1D9' }}>
            Quick Actions
          </h2>
          <div className="space-y-2">
            {[
              { label: 'Manage Issues', href: '/admin/issues', desc: 'Edit wellbeing issue content' },
              { label: 'State Data', href: '/admin/states', desc: 'Update state-level statistics' },
              { label: 'Content Blocks', href: '/admin/content', desc: 'Edit page sections and text' },
              { label: 'Settings', href: '/admin/settings', desc: 'Site configuration' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center justify-between px-4 py-3 rounded-lg transition-colors group hover:border-blue-500"
                style={{ background: '#0D1117', border: '1px solid #21262D' }}
              >
                <div>
                  <div className="text-sm font-medium" style={{ color: '#E6EDF3' }}>{item.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#484F58' }}>{item.desc}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#484F58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* System status */}
        <div
          className="rounded-xl p-6"
          style={{ background: '#161B22', border: '1px solid #21262D' }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#C9D1D9' }}>
            System Status
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Supabase Database', status: 'Connected', ok: true },
              { label: 'Authentication', status: 'Active', ok: true },
              { label: 'OpenAI Integration', status: 'Not configured', ok: false },
              { label: 'Vercel Deployment', status: 'Live', ok: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: '#8B949E' }}>{item.label}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: item.ok ? '#0D2818' : '#2D1317',
                    color: item.ok ? '#2DA44E' : '#F85149',
                    border: `1px solid ${item.ok ? '#2DA44E30' : '#F8514930'}`,
                  }}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          <div
            className="mt-6 pt-4 text-xs"
            style={{ borderTop: '1px solid #21262D', color: '#484F58' }}
          >
            Next step: configure OpenAI API key to enable AI-powered content generation.
          </div>
        </div>
      </div>
    </div>
  );
}
