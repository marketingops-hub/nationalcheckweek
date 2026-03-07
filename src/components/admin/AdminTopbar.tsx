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
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 flex-shrink-0">

      {/* Left: search or breadcrumbs */}
      <div className="flex-1 max-w-xl">
        {showBreadcrumbs ? (
          <nav className="flex items-center gap-1.5" aria-label="Breadcrumb">
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <span key={crumb.href} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <span className="text-slate-300 text-sm">/</span>
                  )}
                  {isLast ? (
                    <span className="text-sm font-semibold text-slate-900">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>
        ) : (
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#5925f4] transition-colors text-[20px]">search</span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-[#5925f4]/20 text-sm outline-none"
              placeholder="Search resources, users or reports..."
              type="text"
            />
          </div>
        )}
      </div>

      {/* Right actions — exactly as in reference */}
      <div className="flex items-center gap-4 ml-8">
        {/* Notifications */}
        <button className="size-10 flex items-center justify-center rounded-lg hover:bg-slate-100 relative transition-colors">
          <span className="material-symbols-outlined text-slate-600">notifications</span>
          <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* Chat bubble */}
        <button className="size-10 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
          <span className="material-symbols-outlined text-slate-600">chat_bubble</span>
        </button>

        {/* Divider */}
        <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>

        {/* New Report CTA */}
        <Link
          href="/admin/cms/pages/new"
          className="flex items-center gap-2 px-3 py-1.5 bg-[#5925f4] text-white rounded-lg text-sm font-medium hover:bg-[#5925f4]/90 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Report
        </Link>
      </div>
    </header>
  );
}
