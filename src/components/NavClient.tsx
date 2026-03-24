"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export interface NavLink {
  id: string;
  href: string;
  label: string;
  target: string;
}

export default function NavClient({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  /* Keyboard handling: Escape closes, Tab traps focus inside drawer */
  useEffect(() => {
    if (!open) return;
    const drawer = drawerRef.current;
    const focusable = drawer?.querySelectorAll<HTMLElement>("a, button, [tabindex]");
    if (focusable?.length) focusable[0].focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { close(); return; }
      if (e.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-logo" onClick={close}>
          <Image
            src="/logo/nciw_no_background-1024x577.png"
            alt="National Check-in Week"
            height={52}
            width={92}
            style={{ objectFit: "contain" }}
            priority
          />
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
