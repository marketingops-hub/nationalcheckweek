'use client';

import { motion } from 'framer-motion';
import type { BePartCTABlockContent } from '@/types/homepage-blocks';

interface BePartCTABlockProps {
  content: BePartCTABlockContent;
  accentColor?: string;
}

export default function BePartCTABlock({ content, accentColor: globalAccent }: BePartCTABlockProps) {
  const { colors } = content;
  const useGlobal = colors?.useGlobalColors !== false;
  const bgColor = useGlobal ? (globalAccent || '#29B8E8') : (colors?.backgroundColor || '#29B8E8');
  const textColor = useGlobal ? '#FFFFFF' : (colors?.textColor || '#FFFFFF');
  const buttonBg = useGlobal ? '#FFFFFF' : (colors?.primaryButton || '#FFFFFF');
  const buttonText = useGlobal ? (globalAccent || '#29B8E8') : (colors?.primaryButtonText || '#29B8E8');

  return (
    <section style={{ padding: '80px 20px', background: bgColor }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 700, 
            color: textColor,
            marginBottom: '16px',
            lineHeight: 1.2
          }}>
            {content.heading}
          </h2>
          
          <p style={{ 
            fontSize: '1.125rem', 
            color: textColor,
            marginBottom: '24px',
            opacity: 0.95
          }}>
            {content.subheading}
          </p>
          
          <p style={{ 
            fontSize: '1.0625rem', 
            color: textColor,
            lineHeight: 1.8,
            marginBottom: '40px',
            opacity: 0.9
          }}>
            {content.description}
          </p>

          <a
            href={content.ctaLink}
            style={{
              display: 'inline-block',
              padding: '16px 40px',
              background: buttonBg,
              color: buttonText,
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '1.0625rem',
              textDecoration: 'none',
              border: `2px solid ${buttonBg}`,
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
          >
            {content.ctaText}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
