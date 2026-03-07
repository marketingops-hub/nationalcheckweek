import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface ContentRow {
  id: string;
  title: string;
  slug: string;
  type: "issue" | "state" | "area" | "page";
  status: string;
  updated_at: string;
  editHref: string;
  viewHref: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
}

export default async function CmsIndexPage() {
  const sb = await createClient();

  const [
    { data: issues },
    { data: states },
    { data: areas },
    { data: pages },
  ] = await Promise.all([
    sb.from("issues").select("id, title, slug, updated_at").order("rank"),
    sb.from("states").select("id, name, slug, updated_at").order("name"),
    sb.from("areas").select("id, name, slug, updated_at").order("name"),
    sb.from("pages").select("id, title, slug, status, updated_at").order("updated_at", { ascending: false }),
  ]);

  const rows: ContentRow[] = [
    ...(pages ?? []).map(p => ({
      id: p.id, title: p.title, slug: p.slug,
      type: "page" as const,
      status: p.status,
      updated_at: p.updated_at,
      editHref: `/admin/cms/pages/${p.id}`,
      viewHref: `/pages/${p.slug}`,
      badge: p.status === "published" ? "Published" : "Draft",
      badgeColor: p.status === "published" ? "#166534" : "#475569",
      badgeBg: p.status === "published" ? "#dcfce7" : "#f1f5f9",
    })),
    ...(issues ?? []).map(i => ({
      id: i.id, title: i.title, slug: i.slug,
      type: "issue" as const,
      status: "published",
      updated_at: i.updated_at,
      editHref: `/admin/issues/${i.id}`,
      viewHref: `/issues/${i.slug}`,
      badge: "Issue",
      badgeColor: "#991b1b",
      badgeBg: "#fee2e2",
    })),
    ...(states ?? []).map(s => ({
      id: s.id, title: s.name, slug: s.slug,
      type: "state" as const,
      status: "published",
      updated_at: s.updated_at,
      editHref: `/admin/states/${s.id}`,
      viewHref: `/states/${s.slug}`,
      badge: "State",
      badgeColor: "#5925f4",
      badgeBg: "rgba(89,37,244,0.1)",
    })),
    ...(areas ?? []).map(a => ({
      id: a.id, title: a.name, slug: a.slug,
      type: "area" as const,
      status: "published",
      updated_at: a.updated_at,
      editHref: `/admin/content/${a.id}`,
      viewHref: `/areas/${a.slug}`,
      badge: "Area",
      badgeColor: "#854d0e",
      badgeBg: "#fef9c3",
    })),
  ];

  const TYPE_LABELS: Record<string, string> = {
    page: "CMS Page",
    issue: "Issue",
    state: "State",
    area: "Area / City",
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>All Content</h1>
          <p className="text-sm mt-1" style={{ color: "var(--admin-text-subtle)" }}>
            Every editable page on the site. Each content type opens its own structured editor — respecting its module layout.
          </p>
        </div>
        <Link href="/admin/cms/pages/new" className="admin-btn admin-btn-primary">
          + New CMS Page
        </Link>
      </div>

      {/* Type legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { type: "page",  label: "CMS Page",   badgeClass: "admin-badge-green",  desc: "Free-form block editor" },
          { type: "issue", label: "Issue",       badgeClass: "admin-badge-red",    desc: "Structured wellbeing issue" },
          { type: "state", label: "State",       badgeClass: "admin-badge-indigo", desc: "State data page" },
          { type: "area",  label: "Area / City", badgeClass: "admin-badge-yellow", desc: "City or region page" },
        ].map(t => (
          <div key={t.type} className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: "var(--admin-bg-elevated)", border: "1px solid var(--admin-border)" }}>
            <span className={`admin-badge ${t.badgeClass}`}>{t.label}</span>
            <span className="text-xs" style={{ color: "var(--admin-text-subtle)" }}>— {t.desc}</span>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "CMS Pages", count: pages?.length ?? 0,  href: "/admin/cms/pages", colorVar: "var(--admin-success)" },
          { label: "Issues",    count: issues?.length ?? 0, href: "/admin/issues",     colorVar: "var(--admin-danger)" },
          { label: "States",    count: states?.length ?? 0, href: "/admin/states",     colorVar: "var(--admin-accent)" },
          { label: "Areas",     count: areas?.length ?? 0,  href: "/admin/content",    colorVar: "var(--admin-warning-light)" },
        ].map(s => (
          <Link key={s.label} href={s.href} className="admin-card block py-4 hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold mb-0.5" style={{ color: s.colorVar }}>{s.count}</div>
            <div className="text-xs" style={{ color: "var(--admin-text-subtle)" }}>{s.label}</div>
          </Link>
        ))}
      </div>

      {/* All content table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th className="hidden md:table-cell">Slug</th>
              <th className="hidden lg:table-cell">Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.type}-${row.id}`}>
                <td>
                  <div className="font-medium" style={{ color: "var(--admin-text-primary)" }}>{row.title}</div>
                </td>
                <td>
                  <div className="flex flex-col gap-1">
                    <span className="admin-badge text-xs font-bold rounded w-fit"
                      style={{ background: row.badgeBg, color: row.badgeColor }}>
                      {row.badge}
                    </span>
                    <span className="text-xs hidden sm:block" style={{ color: "var(--admin-text-faint)" }}>
                      {TYPE_LABELS[row.type]}
                    </span>
                  </div>
                </td>
                <td className="hidden md:table-cell">
                  <span className="text-xs font-mono" style={{ color: "var(--admin-text-faint)" }}>/{row.slug}</span>
                </td>
                <td className="text-xs hidden lg:table-cell" style={{ color: "var(--admin-text-subtle)" }}>
                  {new Date(row.updated_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td>
                  <div className="flex items-center justify-end gap-2">
                    <Link href={row.viewHref} target="_blank" className="admin-btn admin-btn-secondary text-xs py-1 px-3">
                      View ↗
                    </Link>
                    <Link href={row.editHref} className="admin-btn admin-btn-primary text-xs py-1 px-3">
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Editor guide */}
      <div className="mt-6 rounded-xl p-5" style={{ background: "var(--admin-accent-bg)", border: "1px solid rgba(89,37,244,0.12)" }}>
        <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--admin-accent)" }}>How editing works per content type</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "CMS Pages",     color: "var(--admin-success)",      desc: "Free-form block editor. Add, remove and reorder any blocks (heading, paragraph, image, CTA, callout, two-col, HTML). Full creative control. No locked structure." },
            { label: "Issues",        color: "var(--admin-danger)",        desc: "Structured form editor with dedicated fields: title, definition, Australian data, mechanisms, impact boxes, at-risk groups, and sources. Layout is fixed by the Issue page template." },
            { label: "States",        color: "var(--admin-accent)",        desc: "Structured form with state name, subtitle, and a JSONB array of priority wellbeing issues (name, badge color, stat, description). Layout is fixed by the State page template." },
            { label: "Areas / Cities",color: "var(--admin-warning-light)", desc: "Structured form with area name, type, population, schools, overview, key stats, priority issues, and prevention note. Layout is fixed by the Area page template." },
          ].map(item => (
            <div key={item.label} className="flex gap-3">
              <div className="w-1.5 rounded-full flex-shrink-0 mt-1" style={{ background: item.color, minHeight: "16px" }} />
              <div>
                <div className="text-xs font-bold mb-1" style={{ color: item.color }}>{item.label}</div>
                <div className="text-xs leading-relaxed" style={{ color: "var(--admin-text-muted)" }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
