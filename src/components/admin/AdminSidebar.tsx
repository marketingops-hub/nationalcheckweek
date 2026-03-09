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
    <aside
      style={{
        width: open ? '256px' : '64px',
        transition: 'width 280ms cubic-bezier(0.4,0,0.2,1)',
        background: '#fff',
        borderRight: '1px solid var(--admin-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Brand — exactly 64px to align with topbar h-16 */}
      <div style={{ height: 64, padding: '0 16px', borderBottom: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'linear-gradient(135deg, #5925f4, #7c4ef7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', flexShrink: 0, boxShadow: '0 2px 8px rgba(89,37,244,0.35)',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>grid_view</span>
        </div>
        <div style={{ overflow: 'hidden', opacity: open ? 1 : 0, transition: 'opacity 200ms ease', whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--admin-text-primary)', lineHeight: 1.2 }}>SWA Admin</div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--admin-text-faint)', marginTop: 1 }}>Schools Wellbeing AU</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {SECTIONS.map((section, sIdx) => (
          <div key={sIdx} style={{ marginTop: sIdx > 0 ? 16 : 0 }}>
            {section.title && open && (
              <div style={{
                padding: '0 10px 6px',
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--admin-text-faint)',
              }}>
                {section.title}
              </div>
            )}
            {section.title && !open && (
              <div style={{ height: 1, background: 'var(--admin-border)', margin: '8px 4px 6px' }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: open ? '9px 10px' : '9px 0',
                      justifyContent: open ? 'flex-start' : 'center',
                      borderRadius: 8,
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#5925f4' : 'var(--admin-text-muted)',
                      background: isActive ? 'rgba(89,37,244,0.08)' : 'transparent',
                      borderRight: isActive ? '3px solid #5925f4' : '3px solid transparent',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      transition: 'background 150ms, color 150ms',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.background = 'var(--admin-bg-elevated)';
                        (e.currentTarget as HTMLAnchorElement).style.color = 'var(--admin-text-secondary)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                        (e.currentTarget as HTMLAnchorElement).style.color = 'var(--admin-text-muted)';
                      }
                    }}
                  >
                    <span aria-hidden="true" className="material-symbols-outlined" style={{
                      fontSize: 20,
                      flexShrink: 0,
                      color: isActive ? '#5925f4' : 'var(--admin-text-faint)',
                    }}>{item.ms}</span>
                    {open && <span style={{ overflow: 'hidden', opacity: open ? 1 : 0, transition: 'opacity 180ms ease' }}>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--admin-border)', flexShrink: 0 }}>
        {/* User row */}
        <div style={{ padding: '12px 8px 8px', display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #5925f4, #7c4ef7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8125rem', fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {(userEmail || 'A')[0].toUpperCase()}
          </div>
          {open && (
            <div style={{ flex: 1, overflow: 'hidden', opacity: open ? 1 : 0, transition: 'opacity 180ms ease', whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--admin-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userEmail ? userEmail.split('@')[0] : 'Admin'}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--admin-text-faint)' }}>Admin Account</div>
            </div>
          )}
          {open && (
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              aria-label="Sign out"
              style={{
                flexShrink: 0, width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6, border: 'none', background: 'transparent',
                color: 'var(--admin-text-faint)', cursor: 'pointer',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
            </button>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
          style={{
            width: '100%', padding: '10px 0',
            display: 'flex', alignItems: 'center',
            justifyContent: open ? 'flex-start' : 'center',
            paddingLeft: open ? 18 : 0,
            gap: 8,
            background: 'transparent', border: 'none',
            borderTop: '1px solid var(--admin-border)',
            color: 'var(--admin-text-faint)',
            cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500,
          }}
        >
          <span aria-hidden="true" className="material-symbols-outlined" style={{
            fontSize: 18,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 280ms cubic-bezier(0.4,0,0.2,1)',
          }}>chevrons_right</span>
          {open && <span aria-hidden="true" style={{ opacity: 1, transition: 'opacity 180ms ease' }}>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
