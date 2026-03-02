"use client";
import Link from "next/link";
import { useState } from "react";

const LINKS = [
  { href: "#map",        label: "Map" },
  { href: "#issues",     label: "Issues" },
  { href: "#prevention", label: "Prevention" },
  { href: "#research",   label: "Research" },
  { href: "#data",       label: "Data" },
];

export default function Nav() {
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
          {LINKS.map((l) => (
            <li key={l.href}><a href={l.href}>{l.label}</a></li>
          ))}
        </ul>

        {/* Hamburger button */}
        <button
          className="nav-hamburger"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className={`ham-line ${open ? "ham-open" : ""}`} />
          <span className={`ham-line ${open ? "ham-open" : ""}`} />
          <span className={`ham-line ${open ? "ham-open" : ""}`} />
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="nav-drawer" onClick={close}>
          <div className="nav-drawer-inner" onClick={(e) => e.stopPropagation()}>
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="nav-drawer-link" onClick={close}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
