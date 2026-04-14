'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface CTABlockProps {
  content: {
    eyebrow: string;
    heading: string;
    description: string;
    primaryCTA: { text: string; link: string };
    secondaryCTA?: { text: string; link: string };
    backgroundColor?: string;
    textColor?: string;
    colors?: {
      useGlobalColors?: boolean;
      ctaBackground?: string;
      ctaText?: string;
      ctaPrimaryButton?: string;
      primaryButtonText?: string;
    };
  };
  globalColors?: {
    ctaBackground: string;
    ctaText: string;
    ctaPrimaryButton: string;
    primaryButtonText: string;
  };
}

export default function CTABlock({ content, globalColors }: CTABlockProps) {
  const { eyebrow, heading, description, primaryCTA, secondaryCTA, colors } = content;
  
  // Use block colors if override is enabled, otherwise use global colors
  const useGlobal = colors?.useGlobalColors !== false;
  const blockColors = {
    background: useGlobal ? (globalColors?.ctaBackground || '#0B1D35') : (colors?.ctaBackground || '#0B1D35'),
    text: useGlobal ? (globalColors?.ctaText || '#FFFFFF') : (colors?.ctaText || '#FFFFFF'),
    primaryButton: useGlobal ? (globalColors?.ctaPrimaryButton || '#29B8E8') : (colors?.ctaPrimaryButton || '#29B8E8'),
    primaryButtonText: useGlobal ? (globalColors?.primaryButtonText || '#FFFFFF') : (colors?.primaryButtonText || '#FFFFFF'),
  };

  return (
    <section style={{ padding: '80px 20px', backgroundColor: blockColors.background, color: blockColors.text }}>
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', opacity: 0.8 }}>{eyebrow}</div>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '20px', lineHeight: 1.2 }}>{heading}</h2>
        <p style={{ fontSize: '1.125rem', marginBottom: '32px', opacity: 0.9 }}>{description}</p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href={primaryCTA.link} style={{ padding: '16px 32px', background: blockColors.primaryButton, color: blockColors.primaryButtonText, borderRadius: '8px', fontWeight: 600, textDecoration: 'none' }}>
            {primaryCTA.text}
          </Link>
          {secondaryCTA && (
            <Link href={secondaryCTA.link} style={{ padding: '16px 32px', background: 'rgba(255,255,255,0.1)', color: blockColors.text, borderRadius: '8px', fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>
              {secondaryCTA.text}
            </Link>
          )}
        </div>
      </motion.div>
    </section>
  );
}
