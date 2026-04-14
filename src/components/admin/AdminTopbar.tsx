"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const LABELS: Record<string, string> = {
  admin:     "Dashboard",
  issues:    "Issues",
  states:    "States",
  content:   "Areas",
  cms:       "CMS",
  pages:     "Pages",
  menu:      "Menu",
  redirects: "Redirects",
  users:     "Users",
  api:       "API Keys",
  settings:  "Settings",
  vault:     "Vault",
  sources:   "Sources",
  new:       "New",
};

export default function AdminTopbar({ email }: { email: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const isId = /^[0-9a-f-]{8,}$/i.test(seg) || /^\d+$/.test(seg);
    const label = isId ? "Edit" : (LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1));
    return { label, href };
  });

  const showBreadcrumbs = crumbs.length > 1;

  return (
    <header className="h-16 bg-white flex items-center justify-between px-8 sticky top-0 z-10 flex-shrink-0" style={{ borderBottom: '1px solid var(--admin-border)' }}>

      {/* Left: search or breadcrumbs */}
      <div className="flex-1 max-w-xl">
        {showBreadcrumbs ? (
          <nav className="flex items-center gap-1.5" aria-label="Breadcrumb">
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <span key={crumb.href} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <span className="text-sm" style={{ color: 'var(--admin-border-strong)' }}>/</span>
                  )}
                  {isLast ? (
                    <span className="text-sm font-semibold" style={{ color: 'var(--admin-text-primary)' }}>{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="text-sm font-medium transition-colors" style={{ color: 'var(--admin-text-faint)' }}>
                      {crumb.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>
        ) : (
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-[#5925f4] transition-colors text-[20px]" style={{ color: 'var(--admin-text-faint)' }} aria-hidden="true">search</span>
            <label htmlFor="admin-topbar-search" className="sr-only">Search</label>
            <input
              id="admin-topbar-search"
              className="w-full pl-10 pr-4 py-2 rounded-lg border-none text-sm outline-none focus:ring-2 focus:ring-[#5925f4]/20" style={{ background: 'var(--admin-bg-elevated)', color: 'var(--admin-text-primary)' }}
              placeholder="Search resources, users or reports..."
              type="search"
              aria-label="Search admin"
            />
          </div>
        )}
      </div>

      {/* Right: email display */}
      {email && (
        <div className="ml-8 flex items-center gap-2 flex-shrink-0">
          <div className="size-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'var(--admin-accent-gradient)' }}>
            {email[0].toUpperCase()}
          </div>
          <span className="text-sm font-medium hidden lg:block" style={{ color: 'var(--admin-text-muted)' }}>
            {email.split('@')[0]}
          </span>
        </div>
      )}
    </header>
  );
}
