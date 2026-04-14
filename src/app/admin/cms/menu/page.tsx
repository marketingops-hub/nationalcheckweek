import { createClient } from "@/lib/supabase/server";
import MenuManager from "@/components/admin/MenuManager";

export const dynamic = 'force-dynamic';

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
      <div className="admin-page-header">
        <div>
          <h1>Navigation Menu</h1>
          <p className="text-sm mt-1" style={{ color: "var(--admin-text-subtle)" }}>Build the front-end navigation. Drag to reorder, link to CMS pages or any custom URL.</p>
        </div>
      </div>
      <MenuManager initialItems={menuItems ?? []} pages={pages ?? []} />
    </div>
  );
}
