import NavClient, { type NavLink } from "@/components/NavClient";
import { createClient } from "@/lib/supabase/server";

const FALLBACK_LINKS: NavLink[] = [
  { id: "0", href: "/",            label: "Home",       target: "_self" },
  { id: "1", href: "/#map",        label: "Map",        target: "_self" },
  { id: "2", href: "/#issues",     label: "Issues",     target: "_self" },
  { id: "3", href: "/#prevention", label: "Prevention", target: "_self" },
  { id: "4", href: "/#research",   label: "Research",   target: "_self" },
  { id: "5", href: "/#data",       label: "Data",       target: "_self" },
  { id: "6", href: "/resources",   label: "Resources",  target: "_self" },
  { id: "7", href: "/contact",     label: "Contact",    target: "_self" },
];

/** Links always injected regardless of DB content */
const PINNED_START: NavLink[] = [
  { id: "home",      href: "/",         label: "Home",      target: "_self" },
];
const PINNED_END: NavLink[] = [
  { id: "resources", href: "/resources", label: "Resources", target: "_self" },
  { id: "contact",   href: "/contact",   label: "Contact",   target: "_self" },
];

export default async function Nav() {
  let links: NavLink[] = FALLBACK_LINKS;
  try {
    const sb = await createClient();
    const { data, error } = await sb
      .from("menu_items")
      .select("id, label, href, target")
      .eq("is_active", true)
      .is("parent_id", null)
      .order("position");

    if (error) throw error;

    if (data && data.length > 0) {
      const seen = new Set<string>();
      const dbLinks: NavLink[] = data.filter((l) => {
        if (seen.has(l.href)) return false;
        seen.add(l.href);
        return true;
      });

      const startPins = PINNED_START.filter((p) => !dbLinks.find((l) => l.href === p.href));
      const endPins   = PINNED_END.filter((p) => !dbLinks.find((l) => l.href === p.href));
      links = [...startPins, ...dbLinks, ...endPins];
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Nav] DB fetch failed, using fallback links:", err);
    }
  }
  return <NavClient links={links} />;
}
