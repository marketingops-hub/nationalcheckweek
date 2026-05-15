'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

interface Partner {
  id: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  url?: string | null;
  slug: string;
}

interface PartnersSlideshowBlockContent {
  heading?: string;
}

interface Props {
  content: PartnersSlideshowBlockContent;
  accentColor?: string;
  initialPartners?: Record<string, unknown>[];
}

const CARDS_PER_SLIDE = 2;

export default function PartnersSlideshowBlock({ content, accentColor = '#29B8E8', initialPartners }: Props) {
  const [partners, setPartners] = useState<Partner[]>((initialPartners as Partner[] | undefined) ?? []);
  const [loading, setLoading] = useState(!initialPartners);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const heading = content.heading || 'Our Partners';

  useEffect(() => {
    if (initialPartners) return;
    fetch('/api/partners')
      .then(r => r.json())
      .then(d => setPartners(d.partners ?? []))
      .catch(() => setPartners([]))
      .finally(() => setLoading(false));
  }, []);

  // Group partners into pairs
  const slides: Partner[][] = [];
  for (let i = 0; i < partners.length; i += CARDS_PER_SLIDE) {
    slides.push(partners.slice(i, i + CARDS_PER_SLIDE));
  }
  const totalSlides = slides.length;

  const prev = useCallback(() => setCurrent(c => (c - 1 + totalSlides) % totalSlides), [totalSlides]);
  const next = useCallback(() => setCurrent(c => (c + 1) % totalSlides), [totalSlides]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (paused || totalSlides <= 1) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [paused, totalSlides, next]);

  if (loading) return null;
  if (partners.length === 0) return null;

  return (
    <section style={{ padding: '72px 20px', background: '#fff' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Heading */}
        <h2 style={{
          textAlign: 'center',
          fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
          fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
          fontWeight: 800,
          color: '#0f0e1a',
          marginBottom: '48px',
        }}>
          {heading}
        </h2>

        {/* Slideshow wrapper */}
        <div
          style={{ position: 'relative' }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: slides[current]?.length === 1 ? '1fr' : '1fr 1fr',
            gap: '24px',
            minHeight: '320px',
          }}>
            {(slides[current] ?? []).map(partner => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>

          {/* Prev/Next arrows */}
          {totalSlides > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Previous partners"
                style={{
                  position: 'absolute',
                  left: -44,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: `2px solid ${accentColor}`,
                  background: '#fff',
                  color: accentColor,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = accentColor; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = accentColor; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
              </button>
              <button
                onClick={next}
                aria-label="Next partners"
                style={{
                  position: 'absolute',
                  right: -44,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: `2px solid ${accentColor}`,
                  background: '#fff',
                  color: accentColor,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = accentColor; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = accentColor; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
              </button>
            </>
          )}
        </div>

        {/* Dot indicators */}
        {totalSlides > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
                style={{
                  width: i === current ? 20 : 10,
                  height: 10,
                  borderRadius: 99,
                  border: 'none',
                  background: i === current ? accentColor : '#d1d5db',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.25s ease',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PartnerCard({ partner }: { partner: Partner }) {
  const card = (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '16px',
      padding: '32px 28px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      height: '100%',
      cursor: partner.url ? 'pointer' : 'default',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)';
      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
    }}
    >
      {/* Logo */}
      <div style={{
        width: 100,
        height: 100,
        borderRadius: '50%',
        overflow: 'hidden',
        background: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        flexShrink: 0,
      }}>
        {partner.logoUrl ? (
          <Image
            src={partner.logoUrl}
            alt={partner.name}
            width={100}
            height={100}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            unoptimized
          />
        ) : (
          <span style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#9ca3af',
          }}>
            {partner.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      {/* Name */}
      <h3 style={{
        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
        fontSize: '1.125rem',
        fontWeight: 700,
        color: '#0f0e1a',
        marginBottom: partner.description ? '12px' : 0,
        lineHeight: 1.3,
      }}>
        {partner.name}
      </h3>

      {/* Description */}
      {partner.description && (
        <p style={{
          fontSize: '0.9rem',
          color: '#6b7280',
          lineHeight: 1.7,
          fontStyle: 'italic',
          margin: 0,
        }}>
          {partner.description}
        </p>
      )}
    </div>
  );

  if (partner.url) {
    return (
      <a href={partner.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
        {card}
      </a>
    );
  }
  return card;
}
