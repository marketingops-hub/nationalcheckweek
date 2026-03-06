"use client";

import Link from "next/link";
import { useState } from "react";

interface NavLink {
  id: string;
  href: string;
  label: string;
  target: string;
}

export default function NavClient({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  function close() { setOpen(false); }

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-logo" onClick={close}>
          <span>Schools</span>Wellbeing.com.au
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
        <div className="nav-drawer" onClick={close}>
          <div className="nav-drawer-inner" onClick={(e) => e.stopPropagation()}>
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
