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
      { label: 'Issues',     href: '/admin/issues',        ms: 'warning' },
      { label: 'States',     href: '/admin/states',        ms: 'analytics' },
      { label: 'Areas',      href: '/admin/content',       ms: 'location_on' },
    ],
  },
  {
    title: 'CMS',
    items: [
      { label: 'Overview',   href: '/admin/cms',           ms: 'public' },
      { label: 'Pages',      href: '/admin/cms/pages',     ms: 'article' },
      { label: 'Navigation', href: '/admin/cms/menu',      ms: 'menu' },
      { label: 'Redirects',  href: '/admin/cms/redirects', ms: 'alt_route' },
    ],
  },
  {
    title: 'AI',
    items: [
      { label: 'Prompts',    href: '/admin/prompts',       ms: 'prompt_suggestion' },
      { label: 'Vault',      href: '/admin/vault/sources', ms: 'lock' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Users',      href: '/admin/users',         ms: 'group' },
      { label: 'API Keys',   href: '/admin/api',           ms: 'key' },
      { label: 'Settings',   href: '/admin/settings',      ms: 'settings' },
    ],
  },
];

export default function AdminSidebar({ userEmail }: { userEmail: string }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [open, setOpen]           = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <aside className={`admin-sidebar${open ? '' : ' collapsed'}`}>

      {/* Brand */}
      <div className="admin-sidebar-brand">
        <div className="admin-sidebar-logo">
          <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 20 }}>grid_view</span>
        </div>
        <div className="admin-sidebar-brand-text">
          <strong>SWA Admin</strong>
          <span>Schools Wellbeing AU</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="admin-sidebar-nav" aria-label="Admin navigation">
        {SECTIONS.map((section, sIdx) => (
          <div key={sIdx} className="admin-sidebar-section">
            {section.title && open && (
              <div className="admin-sidebar-section-title">{section.title}</div>
            )}
            {section.title && !open && (
              <div className="admin-sidebar-divider" />
            )}
            <div className="admin-sidebar-items">
              {section.items.map((item) => {
                const isActive = item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={!open ? item.label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    className={`admin-sidebar-link${isActive ? ' active' : ''}`}
                  >
                    <span aria-hidden="true" className="material-symbols-outlined admin-sidebar-icon">{item.ms}</span>
                    <span className="admin-sidebar-link-label">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-user">
          <div className="admin-sidebar-avatar">
            {(userEmail || 'A')[0].toUpperCase()}
          </div>
          <div className="admin-sidebar-user-info">
            <strong>{userEmail ? userEmail.split('@')[0] : 'Admin'}</strong>
            <span>Admin Account</span>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            aria-label="Sign out"
            className="admin-sidebar-signout"
          >
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 18 }}>logout</span>
          </button>
        </div>

        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
          className="admin-sidebar-toggle"
        >
          <span aria-hidden="true" className={`material-symbols-outlined admin-sidebar-toggle-icon${open ? ' open' : ''}`}>chevrons_right</span>
          <span className="admin-sidebar-toggle-label">Collapse</span>
        </button>
      </div>
    </aside>
  );
}
