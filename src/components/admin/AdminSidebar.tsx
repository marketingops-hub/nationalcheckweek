'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const SECTIONS = [
  {
    title: null,
    items: [
      { label: 'Dashboard', href: '/admin', ms: 'dashboard' },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Issues', href: '/admin/issues', ms: 'warning' },
      { label: 'States', href: '/admin/states', ms: 'analytics' },
      { label: 'Areas', href: '/admin/content', ms: 'location_on' },
    ],
  },
  {
    title: 'CMS',
    items: [
      { label: 'Overview', href: '/admin/cms', ms: 'public' },
      { label: 'Pages', href: '/admin/cms/pages', ms: 'article' },
      { label: 'Navigation', href: '/admin/cms/menu', ms: 'menu' },
      { label: 'Redirects', href: '/admin/cms/redirects', ms: 'alt_route' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Vault', href: '/admin/vault/sources', ms: 'lock' },
      { label: 'Users', href: '/admin/users', ms: 'group' },
      { label: 'API Keys', href: '/admin/api', ms: 'key' },
      { label: 'Settings', href: '/admin/settings', ms: 'settings' },
    ],
  },
];

export default function AdminSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">

      {/* Brand */}
      <div className="p-6 flex items-center gap-3">
        <div className="size-10 rounded-lg bg-[#5925f4] flex items-center justify-center text-white flex-shrink-0">
          <span className="material-symbols-outlined">grid_view</span>
        </div>
        <div>
          <h1 className="text-lg font-bold leading-none">SWA Admin</h1>
          <p className="text-xs text-slate-500">Schools Wellbeing AU</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 mt-2 overflow-y-auto">
        {SECTIONS.map((section, sIdx) => (
          <div key={sIdx} className={sIdx > 0 ? 'mt-4' : ''}>
            {section.title && (
              <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                      isActive
                        ? 'active-nav'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.ms}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer — user profile */}
      <div className="p-4 mt-auto border-t border-slate-100">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-[#5925f4]/5">
          <div className="size-10 rounded-full bg-[#5925f4] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {(userEmail || 'A')[0].toUpperCase()}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-semibold truncate">
              {userEmail ? userEmail.split('@')[0] : 'Admin'}
            </p>
            <p className="text-xs text-slate-500 truncate">Admin Account</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            title="Sign out"
            className="flex-shrink-0 size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
