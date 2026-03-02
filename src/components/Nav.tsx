"use client";
import Link from "next/link";

export default function Nav() {
  return (
    <nav className="nav">
      <Link href="/" className="nav-logo">
        <span>Schools</span>Wellbeing.com.au
      </Link>
      <ul className="nav-links">
        <li><a href="#map">Map</a></li>
        <li><a href="#issues">Issues</a></li>
        <li><a href="#data">Data</a></li>
        <li><a href="#about">About</a></li>
      </ul>
    </nav>
  );
}
