import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

/**
 * Footer link type
 */
interface FooterLink {
  id: string;
  label: string;
  url: string;
}

/**
 * Social media link type
 */
interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon_svg_path: string;
}

/**
 * FooterModern - Site-wide footer component
 * 
 * Server component that fetches footer settings, links, and social media
 * links from the database. Falls back to sensible defaults if database
 * is unavailable.
 * 
 * Features:
 * - Admin-configurable contact information
 * - Database-driven footer links
 * - Database-driven social media links
 * - Graceful fallbacks for all data
 * - Responsive grid layout
 * 
 * @returns Server-rendered footer with contact info and links
 */
export default async function FooterModern() {
  let logoUrl = "/logo/nciw_no_background-1024x577.png";
  let brandDescription = "Australia's leading student wellbeing initiative, bringing together schools, experts, and communities.";
  let contactPhone = "1300 889 018";
  let contactAddress = "4/597 Darling Street, Rozelle NSW 2039, Australia";
  let contactEmail = "events@nationalcheckinweek.com";
  let copyrightText = "Copyright © 2026 National Check-In Week. All rights reserved.";
  let footerLinks: FooterLink[] = [
    { id: "1", label: "Privacy Policy", url: "/privacy" },
    { id: "2", label: "Terms and Conditions", url: "/terms" },
    { id: "3", label: "Sources", url: "/sources" },
  ];
  let socialLinks: SocialLink[] = [
    {
      id: "1",
      platform: "Facebook",
      url: "#",
      icon_svg_path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
    },
    {
      id: "2",
      platform: "LinkedIn",
      url: "#",
      icon_svg_path: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z",
    },
    {
      id: "3",
      platform: "Instagram",
      url: "#",
      icon_svg_path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-13h-7c-1.38 0-2.5 1.12-2.5 2.5v5c0 1.38 1.12 2.5 2.5 2.5h7c1.38 0 2.5-1.12 2.5-2.5v-5c0-1.38-1.12-2.5-2.5-2.5zm-3.5 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z",
    },
  ];

  try {
    const sb = await createClient();
    
    // Fetch footer settings
    const { data: footerData } = await sb
      .from("home_footer_settings")
      .select("*")
      .eq("id", "00000000-0000-0000-0000-000000000003")
      .single();

    if (footerData) {
      if (footerData.logo_url) logoUrl = footerData.logo_url;
      if (footerData.brand_description) brandDescription = footerData.brand_description;
      if (footerData.contact_phone) contactPhone = footerData.contact_phone;
      if (footerData.contact_address) contactAddress = footerData.contact_address;
      if (footerData.contact_email) contactEmail = footerData.contact_email;
      if (footerData.copyright_text) copyrightText = footerData.copyright_text;
    }

    // Fetch footer links
    const { data: linksData } = await sb
      .from("home_footer_links")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (linksData && linksData.length > 0) {
      footerLinks = linksData;
    }

    // Fetch social links
    const { data: socialData } = await sb
      .from("home_social_links")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (socialData && socialData.length > 0) {
      socialLinks = socialData;
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[FooterModern] Failed to fetch settings, using defaults:", err);
    }
  }

  return (
    <footer>
      <div className="footer-main">
        <div className="footer-logo-col">
          <div className="footer-logo-link">
            <Image
              src={logoUrl}
              alt="National Check-in Week"
              width={140}
              height={79}
              className="footer-logo-img"
            />
            <p style={{ 
              fontFamily: "var(--font-body)", 
              fontSize: "0.875rem", 
              color: "#666", 
              maxWidth: "280px",
              lineHeight: 1.6,
              margin: "12px 0 0 0"
            }}>
              {brandDescription}
            </p>
          </div>
        </div>
        <div className="footer-nav-col">
          <h3 className="footer-nav-heading">Contact Us</h3>
          <ul className="footer-nav-list">
            <li><a href={`tel:${contactPhone}`}>{contactPhone}</a></li>
            <li><span>{contactAddress}</span></li>
            <li><a href={`mailto:${contactEmail}`}>{contactEmail}</a></li>
          </ul>
        </div>
        <div className="footer-nav-col">
          <h3 className="footer-nav-heading">Quick Links</h3>
          <ul className="footer-nav-list">
            {footerLinks.map((link) => (
              <li key={link.id}>
                <a href={link.url}>{link.label}</a>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer-nav-col">
          <h3 className="footer-nav-heading">Social Media</h3>
          <div className="footer-social-row">
            {socialLinks.map((social) => (
              <a
                key={social.id}
                href={social.url}
                aria-label={social.platform}
                className="footer-social-link"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d={social.icon_svg_path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="footer-bottom-bar">
        <p className="footer-copyright">{copyrightText}</p>
      </div>
    </footer>
  );
}
