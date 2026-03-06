import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function CmsPagesPage() {
  const sb = await createClient();
  const { data: pages } = await sb
    .from("pages")
    .select("id, slug, title, description, status, show_in_menu, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#58A6FF" }}>CMS</span>
            <span style={{ color: "#30363D" }}>/</span>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6E7681" }}>Pages</span>
          </div>
          <h1 className="text-xl font-semibold mb-1" style={{ color: "#E6EDF3" }}>Pages</h1>
          <p className="text-sm" style={{ color: "#6E7681" }}>
            Create and manage pages. Published pages can be added to the front-end menu.
          </p>
        </div>
        <Link
          href="/admin/cms/pages/new"
          className="text-sm font-semibold px-4 py-2 rounded-lg flex-shrink-0"
          style={{ background: "#238636", color: "#FFFFFF" }}
        >
          + New Page
        </Link>
      </div>

      {(!pages || pages.length === 0) ? (
        <div className="rounded-xl p-10 text-center" style={{ background: "#161B22", border: "1px solid #21262D" }}>
          <div className="text-3xl mb-3">📄</div>
          <p className="text-sm font-medium mb-1" style={{ color: "#C9D1D9" }}>No pages yet</p>
          <p className="text-xs mb-4" style={{ color: "#484F58" }}>Create your first page and add it to the menu.</p>
          <Link href="/admin/cms/pages/new" className="text-sm font-semibold px-4 py-2 rounded-lg inline-block"
            style={{ background: "#238636", color: "#FFFFFF" }}>
            Create a page
          </Link>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #21262D" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#161B22", borderBottom: "1px solid #21262D" }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#6E7681" }}>Title</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "#6E7681" }}>Status</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: "#6E7681" }}>In Menu</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: "#6E7681" }}>Updated</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: "#6E7681" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page, idx) => (
                <tr key={page.id} style={{ background: idx % 2 === 0 ? "#0D1117" : "#161B22", borderBottom: "1px solid #21262D" }}>
                  <td className="px-4 py-3">
                    <div className="font-medium" style={{ color: "#C9D1D9" }}>{page.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#484F58" }}>/{page.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{
                      background: page.status === "published" ? "#0D2D1A" : "#21262D",
                      color: page.status === "published" ? "#6EE7B7" : "#8B949E",
                      border: `1px solid ${page.status === "published" ? "#166534" : "#30363D"}`,
                    }}>
                      {page.status === "published" ? "● Published" : "○ Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs" style={{ color: page.show_in_menu ? "#6EE7B7" : "#484F58" }}>
                      {page.show_in_menu ? "✓ Yes" : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs hidden md:table-cell" style={{ color: "#6E7681" }}>
                    {new Date(page.updated_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/pages/${page.slug}`} target="_blank"
                        className="text-xs font-semibold px-3 py-1.5 rounded"
                        style={{ background: "#161B22", color: "#6E7681", border: "1px solid #21262D" }}>
                        View ↗
                      </Link>
                      <Link href={`/admin/cms/pages/${page.id}`}
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
      )}
    </div>
  );
}
