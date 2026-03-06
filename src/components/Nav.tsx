import NavClient from "@/components/NavClient";
import { createClient } from "@/lib/supabase/server";

const FALLBACK_LINKS = [
  { id: "1", href: "/#map",        label: "Map",        target: "_self" },
  { id: "2", href: "/#issues",     label: "Issues",     target: "_self" },
  { id: "3", href: "/#prevention", label: "Prevention", target: "_self" },
  { id: "4", href: "/#research",   label: "Research",   target: "_self" },
  { id: "5", href: "/#data",       label: "Data",       target: "_self" },
];

export default async function Nav() {
  let links = FALLBACK_LINKS;
  try {
    const sb = await createClient();
    const { data } = await sb
      .from("menu_items")
      .select("id, label, href, target, parent_id, position")
      .eq("is_active", true)
      .is("parent_id", null)
      .order("position");
    if (data && data.length > 0) links = data;
  } catch {
    // silently fall back to static links
  }
  return <NavClient links={links} />;
}
