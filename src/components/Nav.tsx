import NavClient from "@/components/NavClient";
import { createClient } from "@/lib/supabase/server";

const FALLBACK_LINKS = [
  { id: "0", href: "/",            label: "Home",       target: "_self" },
  { id: "1", href: "/#map",        label: "Map",        target: "_self" },
  { id: "2", href: "/#issues",     label: "Issues",     target: "_self" },
  { id: "3", href: "/#prevention", label: "Prevention", target: "_self" },
  { id: "4", href: "/#research",   label: "Research",   target: "_self" },
  { id: "5", href: "/#data",       label: "Data",       target: "_self" },
  { id: "6", href: "/resources",   label: "Resources",  target: "_self" },
  { id: "7", href: "/contact",     label: "Contact",    target: "_self" },
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
    if (data && data.length > 0) {
      const seen = new Set<string>();
      let dbLinks = data.filter((l) => {
        if (seen.has(l.href)) return false;
        seen.add(l.href);
        return true;
      });
      if (!dbLinks.find((l) => l.href === "/")) {
        dbLinks = [{ id: "home", href: "/", label: "Home", target: "_self", parent_id: null, position: -1 }, ...dbLinks];
      }
      if (!dbLinks.find((l) => l.href === "/resources")) {
        dbLinks = [...dbLinks, { id: "resources", href: "/resources", label: "Resources", target: "_self", parent_id: null, position: 999 }];
      }
      if (!dbLinks.find((l) => l.href === "/contact")) {
        dbLinks = [...dbLinks, { id: "contact", href: "/contact", label: "Contact", target: "_self", parent_id: null, position: 1000 }];
      }
      links = dbLinks;
    }
  } catch {
    // silently fall back to static links
  }
  return <NavClient links={links} />;
}
