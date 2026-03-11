"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Partner {
  id: string;
  name: string;
  logoUrl?: string | null;
  slug: string;
}

export default function PartnersCarousel() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/admin/partners")
      .then((r) => r.json())
      .then((d) => setPartners((d.partners ?? []).filter((p: Partner) => p.logoUrl)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || partners.length < 2) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let x = 0;
    let raf: number;
    const speed = 0.4;
    let paused = false;

    function animate() {
      if (!paused) {
        x -= speed;
        const half = track!.scrollWidth / 2;
        if (Math.abs(x) >= half) x = 0;
        track!.style.transform = `translateX(${x}px)`;
      }
      raf = requestAnimationFrame(animate);
    }

    const onEnter = () => { paused = true; };
    const onLeave = () => { paused = false; };
    track.addEventListener("mouseenter", onEnter);
    track.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      track.removeEventListener("mouseenter", onEnter);
      track.removeEventListener("mouseleave", onLeave);
    };
  }, [partners]);

  if (partners.length === 0) return null;

  const items = [...partners, ...partners];

  return (
    <section style={{
      background: "var(--gray-50)", borderTop: "1px solid var(--border)",
      borderBottom: "1px solid var(--border)", padding: "40px 0", overflow: "hidden",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
        <div style={{
          fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
          color: "var(--teal)", marginBottom: 20, textAlign: "center",
        }}>
          Our Partners
        </div>
      </div>
      <div style={{ overflow: "hidden" }}>
        <div ref={trackRef} style={{ display: "flex", alignItems: "center", gap: 48, width: "max-content" }}>
          {items.map((p, i) => (
            <Link key={`${p.id}-${i}`} href={`/partners/${p.slug}`}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 140, height: 60, flexShrink: 0, opacity: 0.6,
                transition: "opacity 0.2s", textDecoration: "none",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "0.6")}
            >
              <Image src={p.logoUrl!} alt={p.name} width={140} height={60}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} unoptimized />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
