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

  return (
    <>
      {/* Stat cards — 3-col grid matching reference */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Issues */}
        <Link href="/admin/issues" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm block">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-slate-500 font-medium">Wellbeing Issues</p>
              <h3 className="text-3xl font-bold mt-1">{issueCount}</h3>
            </div>
            <span className="text-emerald-500 bg-emerald-50 px-2 py-1 rounded text-xs font-bold">Active</span>
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
        <Link href="/admin/states" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm block">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-slate-500 font-medium">States & Territories</p>
              <h3 className="text-3xl font-bold mt-1">{stateCount}</h3>
            </div>
            <span className="text-emerald-500 bg-emerald-50 px-2 py-1 rounded text-xs font-bold">All active</span>
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
        <Link href="/admin/content" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm block">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-slate-500 font-medium">Areas & Cities</p>
              <h3 className="text-3xl font-bold mt-1">{areaCount}</h3>
            </div>
            <span className="text-rose-500 bg-rose-50 px-2 py-1 rounded text-xs font-bold">{pageCount} pages</span>
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

        {/* Left col — system health + recent activity */}
        <div className="lg:col-span-2 space-y-8">

          {/* System Health — donut + metrics matching reference */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold">System Health</h3>
              <button className="text-[#5925f4] text-sm font-semibold flex items-center gap-1">
                Refresh <span className="material-symbols-outlined text-[18px]">sync</span>
              </button>
            </div>
            <div className="p-8 flex flex-col md:flex-row items-center gap-12">
              <div className="relative size-48 flex-shrink-0">
                <svg className="size-full -rotate-180" viewBox="0 0 36 36">
                  <path className="stroke-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray="50, 100" strokeLinecap="round" strokeWidth="3"/>
                  <path stroke="#5925f4" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray="84, 100" strokeLinecap="round" strokeWidth="3"/>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-bold">84%</span>
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Optimal</span>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">Supabase DB</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-2 flex-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[100%]"></div>
                    </div>
                    <span className="text-xs font-bold">OK</span>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">Auth</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-2 flex-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#5925f4] w-[100%]"></div>
                    </div>
                    <span className="text-xs font-bold">Active</span>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">AI Integration</p>
                  <p className="text-sm font-bold mt-1 text-amber-500">Not set</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">Deployment</p>
                  <p className="text-sm font-bold mt-1 text-emerald-500">Live</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity — exactly as reference */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold">Recent Activity</h3>
              <button className="text-slate-500 hover:text-slate-800 text-sm font-medium">View All</button>
            </div>
            <div className="divide-y divide-slate-100">
              <div className="p-4 hover:bg-slate-50 flex items-start gap-4 transition-colors">
                <div className="size-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">article</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm"><span className="font-semibold">Issue published:</span> New wellbeing issue went live.</p>
                  <p className="text-xs text-slate-500 mt-1">2 minutes ago</p>
                </div>
              </div>
              <div className="p-4 hover:bg-slate-50 flex items-start gap-4 transition-colors">
                <div className="size-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">analytics</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm"><span className="font-semibold">State data updated:</span> Victoria statistics refreshed.</p>
                  <p className="text-xs text-slate-500 mt-1">45 minutes ago</p>
                </div>
              </div>
              <div className="p-4 hover:bg-slate-50 flex items-start gap-4 transition-colors">
                <div className="size-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">location_on</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm"><span className="font-semibold">New area added:</span> Northern Beaches (NSW) created.</p>
                  <p className="text-xs text-slate-500 mt-1">1 hour ago</p>
                </div>
              </div>
              <div className="p-4 hover:bg-slate-50 flex items-start gap-4 transition-colors">
                <div className="size-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">update</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm"><span className="font-semibold">CMS page edited:</span> About page content updated.</p>
                  <p className="text-xs text-slate-500 mt-1">3 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right col — quick actions + upsell card */}
        <div className="space-y-8">

          {/* Quick Actions — exactly as reference */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold mb-6">Quick Actions</h3>
            <div className="space-y-3">
              {QUICK_ACTIONS.map((item) => (
                <Link key={item.href} href={item.href}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-[#5925f4]/50 hover:bg-[#5925f4]/5 transition-all group">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#5925f4]">{item.ms}</span>
                    <span className="text-sm font-semibold">{item.label}</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Upsell / promo card — exactly as reference gradient */}
          <div className="bg-gradient-to-br from-[#5925f4] to-[#7c56ff] rounded-xl p-6 text-white relative overflow-hidden shadow-lg shadow-[#5925f4]/20">
            <div className="relative z-10">
              <h4 className="text-lg font-bold mb-2">
                {userEmail ? <>Welcome, {userEmail.split('@')[0]}!</> : 'Pro Features'}
              </h4>
              <p className="text-sm opacity-90 mb-4">
                {userEmail
                  ? 'Keep content fresh to improve site rankings and user trust.'
                  : 'Get unlimited access to advanced analytics modules.'}
              </p>
              <Link href="/admin/issues"
                className="w-full block text-center py-2 bg-white text-[#5925f4] font-bold rounded-lg text-sm hover:bg-opacity-90 transition-colors">
                Manage Issues
              </Link>
            </div>
            <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-white/10 text-[120px] pointer-events-none select-none">workspace_premium</span>
          </div>
        </div>
      </div>
    </>
  );
}
