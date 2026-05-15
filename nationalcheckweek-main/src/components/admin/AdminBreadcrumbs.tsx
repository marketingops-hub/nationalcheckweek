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

export default function AdminBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean); // ['admin', 'issues', '123']

  // Build crumb list: each crumb has a label and href
  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    // If it looks like a UUID or numeric ID, label it "Edit"
    const isId = /^[0-9a-f-]{8,}$/i.test(seg) || /^\d+$/.test(seg);
    const label = isId ? "Edit" : (LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1));
    return { label, href };
  });

  if (crumbs.length <= 1) return null; // just "Dashboard" — no breadcrumb needed

  return (
    <nav className="flex items-center gap-1.5" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--admin-border-strong)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            )}
            {isLast ? (
              <span className="text-sm font-semibold" style={{ color: "var(--admin-text-primary)" }}>{crumb.label}</span>
            ) : (
              <Link href={crumb.href}
                className="text-sm transition-colors"
                style={{ color: "var(--admin-text-subtle)" }}>
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
