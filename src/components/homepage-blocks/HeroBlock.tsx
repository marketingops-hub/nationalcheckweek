'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

interface HeroBlockProps {
  content: {
    heading: string;
    subheading: string;
    primaryCTA: { text: string; link: string };
    secondaryCTA?: { text: string; link: string };
    backgroundImage?: string;
    badge?: { emoji: string; text: string };
    showCountdown?: boolean;
    countdownTarget?: string;
    countdownLabel?: string;
    colors?: {
      useGlobalColors?: boolean;
      primaryButton?: string;
      primaryButtonText?: string;
      secondaryButton?: string;
      secondaryButtonText?: string;
      heading?: string;
      subheading?: string;
      backgroundColor?: string;
      badgeBackground?: string;
      badgeBorder?: string;
      badgeText?: string;
    };
  };
  globalColors?: {
    primaryButton: string;
    primaryButtonText: string;
    secondaryButton: string;
    secondaryButtonText: string;
    heading: string;
    subheading: string;
  };
}

function Countdown({ target, label }: { target: string; label: string }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const targetDate = new Date(target);
    
    const tick = () => {
      const ms = Math.max(0, targetDate.getTime() - Date.now());
      setTime({
        d: Math.floor(ms / 86400000),
        h: Math.floor((ms % 86400000) / 3600000),
        m: Math.floor((ms % 3600000) / 60000),
        s: Math.floor((ms % 60000) / 1000)
      });
    };
    
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [target]);

  if (!mounted) return <div style={{ height: 88 }} />;

  return (
    <div>
      <p style={{ 
        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.35)',
        marginBottom: '14px'
      }}>
        {label}
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        {[['d', 'Days'], ['h', 'Hrs'], ['m', 'Min'], ['s', 'Sec']].map(([key, lbl]) => (
          <div key={key} style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '14px',
            padding: '14px 18px',
            textAlign: 'center',
            minWidth: '68px',
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
              fontSize: '2rem',
              fontWeight: 900,
              lineHeight: 1,
              color: '#fff',
              letterSpacing: '-0.02em'
            }}>
              {String(time[key as keyof typeof time]).padStart(2, '0')}
            </div>
            <div style={{
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.4)',
              marginTop: '6px'
            }}>
              {lbl}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HeroBlock({ content, globalColors }: HeroBlockProps) {
  const { heading, subheading, primaryCTA, secondaryCTA, backgroundImage, badge, colors, showCountdown, countdownTarget, countdownLabel } = content;
  
  // Use block colors if override is enabled, otherwise use global colors
  const useGlobal = colors?.useGlobalColors !== false;
  const blockColors = {
    primaryButton: useGlobal ? (globalColors?.primaryButton || '#29B8E8') : (colors?.primaryButton || '#29B8E8'),
    primaryButtonText: useGlobal ? (globalColors?.primaryButtonText || '#FFFFFF') : (colors?.primaryButtonText || '#FFFFFF'),
    secondaryButton: useGlobal ? (globalColors?.secondaryButton || 'rgba(255,255,255,0.2)') : (colors?.secondaryButton || 'rgba(255,255,255,0.2)'),
    secondaryButtonText: useGlobal ? (globalColors?.secondaryButtonText || '#FFFFFF') : (colors?.secondaryButtonText || '#FFFFFF'),
    headingColor: useGlobal ? (globalColors?.heading || '#FFFFFF') : (colors?.heading || '#FFFFFF'),
    subheadingColor: useGlobal ? (globalColors?.subheading || '#FFFFFF') : (colors?.subheading || '#FFFFFF'),
  };

  const bgStyle = colors?.backgroundColor || 'linear-gradient(135deg, #0a1628 0%, #0f2444 50%, #091d38 100%)';

  return (
    <section style={{ 
      position: 'relative', 
      overflow: 'hidden',
      background: bgStyle,
      padding: '200px 20px 120px'
    }}>
      {/* Grid pattern overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        pointerEvents: 'none'
      }} />
      
      {/* Gradient overlays */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 60% 80% at 70% 50%, rgba(41,184,232,0.18) 0%, transparent 65%), radial-gradient(ellipse 40% 60% at 10% 90%, rgba(229,0,126,0.12) 0%, transparent 55%)',
        pointerEvents: 'none'
      }} />

      {/* Background Image (if provided) */}
      {backgroundImage && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.3 }}>
          <Image 
            src={backgroundImage} 
            alt="" 
            fill
            style={{ objectFit: 'cover' }}
            priority
            fetchPriority="high"
            quality={50}
            sizes="100vw"
          />
        </div>
      )}

      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        maxWidth: '1280px', 
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '80px',
        alignItems: 'center'
      }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          {badge && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: colors?.badgeBackground || 'rgba(41,184,232,0.15)',
              border: `1px solid ${colors?.badgeBorder || 'rgba(41,184,232,0.3)'}`,
              color: colors?.badgeText || '#7dd3f0',
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              padding: '6px 16px',
              borderRadius: '9999px',
              marginBottom: '24px'
            }}>
              <span>{badge.emoji}</span> {badge.text}
            </div>
          )}

          <h1 style={{
            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            fontSize: 'clamp(2.5rem, 4.5vw, 4rem)',
            fontWeight: 900,
            lineHeight: 1.06,
            letterSpacing: '-0.02em',
            color: blockColors.headingColor,
            marginBottom: '24px'
          }} dangerouslySetInnerHTML={{ __html: heading }} />

          <p style={{
            fontSize: '1.125rem',
            lineHeight: 1.75,
            color: blockColors.subheadingColor,
            maxWidth: '440px',
            marginBottom: '40px'
          }}>
            {subheading}
          </p>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '48px' }}>
            <motion.div whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }}>
              <Link href={primaryCTA.link} style={{
                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                fontSize: '1rem',
                fontWeight: 800,
                color: blockColors.primaryButtonText,
                background: blockColors.primaryButton,
                padding: '16px 36px',
                borderRadius: '9999px',
                boxShadow: '0 8px 32px rgba(41,184,232,0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
                transition: 'transform 0.15s, box-shadow 0.15s'
              }}>
                {primaryCTA.text} <ArrowRight size={18} />
              </Link>
            </motion.div>
            {secondaryCTA && (
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href={secondaryCTA.link} style={{
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: blockColors.secondaryButtonText,
                  background: blockColors.secondaryButton,
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  padding: '16px 36px',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  transition: 'background 0.15s, border-color 0.15s'
                }}>
                  {secondaryCTA.text}
                </Link>
              </motion.div>
            )}
          </div>

          {showCountdown && countdownTarget && countdownLabel && (
            <Countdown target={countdownTarget} label={countdownLabel} />
          )}
        </motion.div>

        {/* Right column - Image with floating card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          style={{ position: 'relative', display: 'none' }}
          className="lg:block"
        >
          {backgroundImage && (
            <div style={{ position: 'relative' }}>
              <div style={{
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}>
                <Image 
                  src={backgroundImage} 
                  alt="Students collaborating" 
                  width={600} 
                  height={400}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                  quality={60}
                  sizes="(max-width: 768px) 100vw, 600px"
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
