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
      badgeColor: p.status === "published" ? "#6EE7B7" : "#8B949E",
      badgeBg: p.status === "published" ? "#0D2D1A" : "#21262D",
    })),
    ...(issues ?? []).map(i => ({
      id: i.id, title: i.title, slug: i.slug,
      type: "issue" as const,
      status: "published",
      updated_at: i.updated_at,
      editHref: `/admin/issues/${i.id}`,
      viewHref: `/issues/${i.slug}`,
      badge: "Issue",
      badgeColor: "#F87171",
      badgeBg: "#3D1515",
    })),
    ...(states ?? []).map(s => ({
      id: s.id, title: s.name, slug: s.slug,
      type: "state" as const,
      status: "published",
      updated_at: s.updated_at,
      editHref: `/admin/states/${s.id}`,
      viewHref: `/states/${s.slug}`,
      badge: "State",
      badgeColor: "#58A6FF",
      badgeBg: "#1C2A3A",
    })),
    ...(areas ?? []).map(a => ({
      id: a.id, title: a.name, slug: a.slug,
      type: "area" as const,
      status: "published",
      updated_at: a.updated_at,
      editHref: `/admin/content/${a.id}`,
      viewHref: `/areas/${a.slug}`,
      badge: "Area",
      badgeColor: "#C084FC",
      badgeBg: "#2D1A40",
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
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#58A6FF" }}>CMS</span>
          </div>
          <h1 className="text-xl font-semibold mb-1" style={{ color: "#E6EDF3" }}>All Content</h1>
          <p className="text-sm" style={{ color: "#6E7681" }}>
            Every editable page on the site. Each content type opens its own structured editor — respecting its module layout.
          </p>
        </div>
        <Link
          href="/admin/cms/pages/new"
          className="text-sm font-semibold px-4 py-2 rounded-lg flex-shrink-0"
          style={{ background: "#238636", color: "#FFFFFF" }}
        >
          + New CMS Page
        </Link>
      </div>

      {/* Type legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { type: "page",  label: "CMS Page",    color: "#6EE7B7", bg: "#0D2D1A", desc: "Free-form block editor" },
          { type: "issue", label: "Issue",        color: "#F87171", bg: "#3D1515", desc: "Structured wellbeing issue" },
          { type: "state", label: "State",        color: "#58A6FF", bg: "#1C2A3A", desc: "State data page" },
          { type: "area",  label: "Area / City",  color: "#C084FC", bg: "#2D1A40", desc: "City or region page" },
        ].map(t => (
          <div key={t.type} className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: t.bg, border: `1px solid ${t.color}22` }}>
            <span className="text-xs font-bold" style={{ color: t.color }}>{t.label}</span>
            <span className="text-xs" style={{ color: "#6E7681" }}>— {t.desc}</span>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "CMS Pages",  count: pages?.length ?? 0,  href: "/admin/cms/pages",    color: "#6EE7B7", bg: "#0D2D1A" },
          { label: "Issues",     count: issues?.length ?? 0, href: "/admin/issues",        color: "#F87171", bg: "#3D1515" },
          { label: "States",     count: states?.length ?? 0, href: "/admin/states",        color: "#58A6FF", bg: "#1C2A3A" },
          { label: "Areas",      count: areas?.length ?? 0,  href: "/admin/content",       color: "#C084FC", bg: "#2D1A40" },
        ].map(s => (
          <Link key={s.label} href={s.href} className="rounded-xl px-4 py-4 block"
            style={{ background: s.bg, border: `1px solid ${s.color}22`, textDecoration: "none" }}>
            <div className="text-2xl font-bold mb-0.5" style={{ color: s.color }}>{s.count}</div>
            <div className="text-xs" style={{ color: "#6E7681" }}>{s.label}</div>
          </Link>
        ))}
      </div>

      {/* All content table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #21262D" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#161B22", borderBottom: "1px solid #21262D" }}>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: "#6E7681" }}>Title</th>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: "#6E7681" }}>Type</th>
              <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: "#6E7681" }}>Slug</th>
              <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell" style={{ color: "#6E7681" }}>Updated</th>
              <th className="text-right px-4 py-3 font-semibold" style={{ color: "#6E7681" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={`${row.type}-${row.id}`}
                style={{ background: idx % 2 === 0 ? "#0D1117" : "#161B22", borderBottom: "1px solid #21262D" }}>
                <td className="px-4 py-3">
                  <div className="font-medium" style={{ color: "#C9D1D9" }}>{row.title}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded w-fit"
                      style={{ background: row.badgeBg, color: row.badgeColor }}>
                      {row.badge}
                    </span>
                    <span className="text-xs hidden sm:block" style={{ color: "#484F58" }}>
                      {TYPE_LABELS[row.type]}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs font-mono" style={{ color: "#484F58" }}>/{row.slug}</span>
                </td>
                <td className="px-4 py-3 text-xs hidden lg:table-cell" style={{ color: "#6E7681" }}>
                  {new Date(row.updated_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={row.viewHref} target="_blank"
                      className="text-xs font-semibold px-3 py-1.5 rounded"
                      style={{ background: "#161B22", color: "#6E7681", border: "1px solid #21262D" }}>
                      View ↗
                    </Link>
                    <Link href={row.editHref}
                      className="text-xs font-semibold px-3 py-1.5 rounded"
                      style={{ background: "#21262D", color: "#C9D1D9" }}>
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
      <div className="mt-6 rounded-xl p-5" style={{ background: "#161B22", border: "1px solid #21262D" }}>
        <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#58A6FF" }}>How editing works per content type</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "CMS Pages", color: "#6EE7B7", desc: "Free-form block editor. Add, remove and reorder any blocks (heading, paragraph, image, CTA, callout, two-col, HTML). Full creative control. No locked structure." },
            { label: "Issues", color: "#F87171", desc: "Structured form editor with dedicated fields: title, definition, Australian data, mechanisms, impact boxes, at-risk groups, and sources. Layout is fixed by the Issue page template." },
            { label: "States", color: "#58A6FF", desc: "Structured form with state name, subtitle, and a JSONB array of priority wellbeing issues (name, badge color, stat, description). Layout is fixed by the State page template." },
            { label: "Areas / Cities", color: "#C084FC", desc: "Structured form with area name, type, population, schools, overview, key stats, priority issues, and prevention note. Layout is fixed by the Area page template." },
          ].map(item => (
            <div key={item.label} className="flex gap-3">
              <div className="w-1.5 rounded-full flex-shrink-0 mt-1" style={{ background: item.color, minHeight: "16px" }} />
              <div>
                <div className="text-xs font-bold mb-1" style={{ color: item.color }}>{item.label}</div>
                <div className="text-xs leading-relaxed" style={{ color: "#6E7681" }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
