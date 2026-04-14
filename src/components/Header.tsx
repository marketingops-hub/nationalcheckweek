import HeaderClient from "./HeaderClient";
import { createClient } from "@/lib/supabase/server";

/**
 * Navigation link type used throughout the header
 */
export type NavLink = {
  id: string;
  href: string;
  label: string;
  target: string;
};

const FALLBACK_LINKS: NavLink[] = [
  { id: "0", href: "/", label: "Home", target: "_self" },
  { id: "1", href: "/resources", label: "Resources", target: "_self" },
  { id: "2", href: "/faq", label: "FAQ", target: "_self" },
  { id: "3", href: "/ambassadors", label: "Ambassadors", target: "_self" },
];

const PINNED_START: NavLink[] = [
  { id: "home", href: "/", label: "Home", target: "_self" },
];

const PINNED_END: NavLink[] = [
  { id: "resources", href: "/resources", label: "Resources", target: "_self" },
  { id: "contact", href: "/contact", label: "Contact", target: "_self" },
];

/**
 * Header - Site-wide navigation component
 * 
 * Server component that fetches navigation menu items from the database
 * and hero settings for logo/CTA button configuration. Falls back to
 * sensible defaults if database is unavailable.
 * 
 * Features:
 * - Database-driven menu items with deduplication
 * - Pinned start/end navigation items
 * - Admin-configurable logo and CTA button
 * - Graceful fallbacks for all data
 * 
 * @returns Server-rendered header with navigation
 */
export default async function Header() {
  let links: NavLink[] = FALLBACK_LINKS;
  let logoUrl = "/logo/nciw_no_background-1024x577.png";
  let logoHeight = 160;
  let ctaText = "Register Now";
  let ctaLink = "/events";

  try {
    // Fetch menu items from database
    const sb = await createClient();
    const { data, error } = await sb
      .from("menu_items")
      .select("id, label, href, target")
      .eq("is_active", true)
      .is("parent_id", null)
      .order("position");

    if (!error && data && data.length > 0) {
      const seen = new Set<string>();
      const dbLinks: NavLink[] = data.filter((l) => {
        if (seen.has(l.href)) return false;
        seen.add(l.href);
        return true;
      });

      const startPins = PINNED_START.filter(
        (p) => !dbLinks.find((l) => l.href === p.href)
      );
      const endPins = PINNED_END.filter(
        (p) => !dbLinks.find((l) => l.href === p.href)
      );
      links = [...startPins, ...dbLinks, ...endPins];
    }

    // Try to fetch hero settings for logo/CTA (optional, fallback to defaults)
    try {
      const { data: heroData } = await sb
        .from("home_hero_settings")
        .select("logo_url, logo_height, primary_cta_text, primary_cta_link")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .single();

      if (heroData) {
        if (heroData.logo_url) logoUrl = heroData.logo_url;
        if (heroData.logo_height) logoHeight = heroData.logo_height;
        if (heroData.primary_cta_text) ctaText = heroData.primary_cta_text;
        if (heroData.primary_cta_link) ctaLink = heroData.primary_cta_link;
      }
    } catch {
      // Hero settings not available, use defaults
      if (process.env.NODE_ENV === "development") {
        console.warn("[Header] Hero settings not available, using defaults");
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Header] DB fetch failed, using fallback:", err);
    }
  }

  return (
    <HeaderClient
      links={links}
      logoUrl={logoUrl}
      logoHeight={logoHeight}
      ctaText={ctaText}
      ctaLink={ctaLink}
    />
  );
}
