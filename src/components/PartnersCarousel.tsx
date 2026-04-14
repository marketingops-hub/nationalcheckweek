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
    fetch("/api/partners")
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
    <section className="partners-carousel">
      <div className="partners-carousel__header">
        <div className="partners-carousel__label">Our Partners</div>
      </div>
      <div className="partners-carousel__track-wrap">
        <div ref={trackRef} className="partners-carousel__track">
          {items.map((p, i) => (
            <Link key={`${p.id}-${i}`} href={`/partners/${p.slug}`} className="partners-carousel__item">
              <Image src={p.logoUrl!} alt={p.name} width={140} height={60} unoptimized />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
