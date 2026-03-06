import { createClient } from "@/lib/supabase/server";
import MenuManager from "@/components/admin/MenuManager";

export default async function CmsMenuPage() {
  const sb = await createClient();

  const [{ data: menuItems }, { data: pages }] = await Promise.all([
    sb.from("menu_items")
      .select("id, label, href, page_id, parent_id, position, target, is_active")
      .order("position"),
    sb.from("pages")
      .select("id, slug, title, status")
      .eq("status", "published")
      .order("title"),
  ]);

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#58A6FF" }}>CMS</span>
          <span style={{ color: "#30363D" }}>/</span>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6E7681" }}>Menu</span>
        </div>
        <h1 className="text-xl font-semibold mb-1" style={{ color: "#E6EDF3" }}>Navigation Menu</h1>
        <p className="text-sm" style={{ color: "#6E7681" }}>
          Build the front-end navigation. Drag to reorder, link to CMS pages or any custom URL.
        </p>
      </div>
      <MenuManager initialItems={menuItems ?? []} pages={pages ?? []} />
    </div>
  );
}
