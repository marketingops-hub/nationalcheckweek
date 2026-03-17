"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface NavLink {
  id: string;
  href: string;
  label: string;
  target: string;
}

export default function NavClient({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  /* Close on Escape key */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  /* Trap focus inside drawer when open */
  useEffect(() => {
    if (!open || !drawerRef.current) return;
    const drawer = drawerRef.current;
    const focusable = drawer.querySelectorAll<HTMLElement>("a, button, [tabindex]");
    if (focusable.length) focusable[0].focus();

    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onTab);
    return () => document.removeEventListener("keydown", onTab);
  }, [open]);

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-logo" onClick={close}>
          <svg className="logo-icon" width="36" height="44" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <ellipse cx="20" cy="20" rx="20" ry="20" fill="#29B8E8"/>
            <circle cx="20" cy="17" r="7" fill="#fff"/>
            <path d="M4 30 Q20 48 36 30" fill="#E5007E"/>
            <path d="M13 20 L18 25 L28 13" stroke="#29B8E8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="nav-logo-text">
            <span>National</span>
            <span>Check-in Week</span>
          </div>
        </Link>

        {/* Desktop links */}
        <ul className="nav-links">
          {links.map((l) => (
            <li key={l.id}>
              <a href={l.href} target={l.target} rel={l.target === "_blank" ? "noopener noreferrer" : undefined}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Hamburger button */}
        <button
          className="nav-hamburger"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className="ham-line" />
          <span className="ham-line" />
          <span className="ham-line" />
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="nav-drawer" onClick={close} role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div ref={drawerRef} className="nav-drawer-inner" onClick={(e) => e.stopPropagation()}>
            {links.map((l) => (
              <a
                key={l.id}
                href={l.href}
                target={l.target}
                rel={l.target === "_blank" ? "noopener noreferrer" : undefined}
                className="nav-drawer-link"
                onClick={close}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
