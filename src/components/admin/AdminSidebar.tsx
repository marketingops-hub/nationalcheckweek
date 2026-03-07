'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const IC = "w-[18px] h-[18px]"; // icon class

const SECTIONS = [
  {
    title: null,
    items: [
      { label: 'Dashboard', href: '/admin', icon: <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Issues', href: '/admin/issues', icon: <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
      { label: 'States', href: '/admin/states', icon: <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
      { label: 'Areas', href: '/admin/content', icon: <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
    ],
  },
  {
    title: 'CMS',
    items: [
      { label: 'Overview', href: '/admin/cms', icon: <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
      { label: 'Pages', href: '/admin/cms/pages', icon: <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
      { label: 'Navigation', href: '/admin/cms/menu', icon: <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg> },
      { label: 'Redirects', href: '/admin/cms/redirects', icon: <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 10 20 15 15 20"/><path d="M4 4v7a4 4 0 0 0 4 4h12"/></svg> },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Vault', href: '/admin/vault/sources', icon: <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
      { label: 'Users', href: '/admin/users', icon: <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
      { label: 'API Keys', href: '/admin/api', icon: <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg> },
      { label: 'Settings', href: '/admin/settings', icon: <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
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
    <aside className="w-60 flex-shrink-0 flex flex-col" style={{ background: '#18181B', borderRight: '1px solid #27272A' }}>
      {/* Brand */}
      <div className="h-16 flex items-center px-5 gap-3" style={{ borderBottom: '1px solid #27272A' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div className="text-sm font-bold" style={{ color: '#FAFAFA' }}>SWA Admin</div>
          <div className="text-[11px]" style={{ color: '#71717A' }}>Schools Wellbeing AU</div>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {SECTIONS.map((section, sIdx) => (
          <div key={sIdx} className={sIdx > 0 ? 'mt-7' : ''}>
            {section.title && (
              <div className="px-3 mb-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#52525B' }}>
                {section.title}
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href}
                    className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium"
                    style={{
                      background: isActive ? '#6366F115' : 'transparent',
                      color: isActive ? '#A5B4FC' : '#A1A1AA',
                      borderLeft: isActive ? '2px solid #6366F1' : '2px solid transparent',
                    }}>
                    <span className="flex-shrink-0" style={{ color: isActive ? '#818CF8' : '#71717A' }}>{item.icon}</span>
                    <span className="group-hover:text-zinc-100">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3" style={{ borderTop: '1px solid #27272A' }}>
        <a href="/" target="_blank" rel="noopener noreferrer"
          className="group flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium mb-1"
          style={{ color: '#71717A' }}>
          <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          <span className="group-hover:text-zinc-100">View site</span>
        </a>

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1"
          style={{ background: '#27272A40' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff' }}>
            {(userEmail || 'A')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] truncate font-medium" style={{ color: '#D4D4D8' }}>{userEmail || 'Admin'}</p>
          </div>
        </div>

        <button onClick={handleSignOut} disabled={signingOut}
          className="group flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium w-full"
          style={{ color: '#71717A' }}>
          <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span className="group-hover:text-red-400">{signingOut ? 'Signing out…' : 'Sign out'}</span>
        </button>
      </div>
    </aside>
  );
}
