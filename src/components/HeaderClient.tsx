"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

/**
 * Navigation link type
 */
export type NavLink = {
  id: string;
  href: string;
  label: string;
  target: string;
  isButton?: boolean;
};

/**
 * Props for HeaderClient component
 */
interface HeaderClientProps {
  /** Navigation links to display */
  links: NavLink[];
  /** URL for the logo image */
  logoUrl: string;
  /** Height of the logo in pixels */
  logoHeight: number;
  /** Text for the CTA button */
  ctaText: string;
  /** Link for the CTA button */
  ctaLink: string;
}

/**
 * HeaderClient - Client-side navigation component
 * 
 * Renders the site header with responsive navigation, mobile menu,
 * and CTA button. Uses Next.js Link for client-side navigation.
 * 
 * Features:
 * - Responsive design (desktop/mobile)
 * - Animated mobile menu with framer-motion
 * - Accessible (aria-labels, keyboard navigation)
 * - Client-side navigation with Next.js Link
 * 
 * @param props - Component props
 * @returns Client-rendered header with navigation
 */
export default function HeaderClient({
  links,
  logoUrl,
  logoHeight,
  ctaText,
  ctaLink,
}: HeaderClientProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav">
      <Link href="/" className="nav-logo">
        <Image
          src={logoUrl}
          alt="National Check-in Week"
          height={logoHeight}
          width={Math.round(logoHeight * 1.77)}
          style={{ objectFit: "contain" }}
          priority
        />
      </Link>
      <nav className="nav-links">
        {/* 
          ⚠️ IMPORTANT: Render ALL navigation links from the array.
          DO NOT use .slice(), .filter(), or limit the number of links here.
          Navigation links are managed via the database (menu_items table).
          If you need to limit links, do it in the data fetching layer, not here.
        */}
        {links.map((link) => (
          link.isButton ? (
            <Link key={link.id} href={link.href} target={link.target} className="nav-btn-register">
              <span>📅</span> {link.label}
            </Link>
          ) : (
            <Link key={link.id} href={link.href} target={link.target}>
              {link.label}
            </Link>
          )
        ))}
      </nav>
      <button
        onClick={() => setOpen(!open)}
        className="nav-hamburger"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>
      {open && (
        <div className="nav-drawer" onClick={() => setOpen(false)}>
          <div className="nav-drawer-inner" onClick={(e) => e.stopPropagation()}>
            {links.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                target={link.target}
                className="nav-drawer-link"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={ctaLink}
              className="nav-drawer-link nav-btn-register"
              onClick={() => setOpen(false)}
            >
              <span>📅</span> {ctaText}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
