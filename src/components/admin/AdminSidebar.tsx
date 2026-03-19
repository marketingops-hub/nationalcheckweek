'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const SECTIONS = [
  {
    label: 'Content',
    items: [
      { label: 'Dashboard',     href: '/admin',              ms: 'dashboard' },
      { label: 'Issues',        href: '/admin/issues',       ms: 'description' },
      { label: 'Votes & Feedback', href: '/admin/votes',      ms: 'thumbs_up_down' },
      { label: 'States & Data', href: '/admin/states',       ms: 'bar_chart' },
      { label: 'Areas',         href: '/admin/content',      ms: 'location_on' },
      { label: 'Schools',       href: '/admin/schools',      ms: 'school' },
    ],
  },
  {
    label: 'Public Pages',
    items: [
      { label: 'Events',       href: '/admin/events',       ms: 'event' },
      { label: 'Ambassadors',  href: '/admin/ambassadors',  ms: 'diversity_3' },
      { label: 'Submissions',  href: '/admin/submissions',  ms: 'inbox' },
      { label: 'Partners',     href: '/admin/partners',     ms: 'handshake' },
      { label: 'FAQ',          href: '/admin/faq',          ms: 'help' },
    ],
  },
  {
    label: 'CMS',
    items: [
      { label: 'Pages',     href: '/admin/cms/pages',    ms: 'article' },
      { label: 'Menu',      href: '/admin/cms/menu',     ms: 'menu' },
      { label: 'Redirects', href: '/admin/cms/redirects', ms: 'alt_route' },
    ],
  },
  {
    label: 'AI',
    items: [
      { label: 'The Vault', href: '/admin/vault/sources', ms: 'lock' },
      { label: 'Prompts',   href: '/admin/prompts',       ms: 'smart_toy' },
      { label: 'SEO',       href: '/admin/seo',           ms: 'travel_explore' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Users',          href: '/admin/users',    ms: 'group' },
      { label: 'API Management', href: '/admin/api',      ms: 'code' },
      { label: 'Settings',       href: '/admin/settings', ms: 'settings' },
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

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'AD';

  return (
    <aside className="swa-sidebar">
      {/* Logo */}
      <div className="swa-sidebar__logo">
        <div className="swa-sidebar__logo-icon">SW</div>
        <div>
          <div className="swa-sidebar__logo-title">Schools Wellbeing</div>
          <div className="swa-sidebar__logo-sub">Admin Panel</div>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="swa-sidebar__nav">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="swa-sidebar__section-label">{section.label}</div>
            {section.items.map((item) => {
              const isActive = item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`swa-sidebar__nav-item${isActive ? ' active' : ''}`}
                >
                  <span className="material-symbols-outlined">{item.ms}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="swa-sidebar__footer">
        <div className="swa-sidebar__user">
          <div className="swa-sidebar__avatar">{initials}</div>
          <div>
            <div className="swa-sidebar__user-name">{userEmail || 'Admin'}</div>
            <div className="swa-sidebar__user-role">Administrator</div>
          </div>
        </div>
        <button
          className="swa-sidebar__logout"
          onClick={handleSignOut}
          disabled={signingOut}
          title="Sign out"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
        </button>
      </div>
    </aside>
  );
}
