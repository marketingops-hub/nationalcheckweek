'use client';

import { motion } from 'framer-motion';
import type { IfNotNowWhenBlockContent } from '@/types/homepage-blocks';

interface Props {
  content: IfNotNowWhenBlockContent;
  accentColor?: string;
}

export default function IfNotNowWhenBlock({ content, accentColor = '#29B8E8' }: Props) {
  const bgColor = content.backgroundColor || '#E30982';
  const checkColor = bgColor;

  return (
    <section style={{ padding: '40px 20px 80px', background: bgColor }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '56px 48px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
          }}
        >
          {/* Section title */}
          {content.sectionTitle && (
            <h2 style={{
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
              fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
              fontWeight: 800,
              color: '#0f0e1a',
              marginBottom: '28px',
              lineHeight: 1.2,
            }}>
              {content.sectionTitle}
            </h2>
          )}

          {/* Main heading */}
          {content.heading && (
            <h3 style={{
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
              fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
              fontWeight: 800,
              color: '#0f0e1a',
              marginBottom: '16px',
              lineHeight: 1.3,
            }}>
              {content.heading}
            </h3>
          )}

          {/* Description */}
          {content.description && (
            <p style={{
              fontSize: '1rem',
              color: '#4a4768',
              lineHeight: 1.8,
              marginBottom: '20px',
            }}>
              {content.description}
            </p>
          )}

          {/* Bold note */}
          {content.boldNote && (
            <p style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: '#0f0e1a',
              marginBottom: '32px',
            }}>
              {content.boldNote}
            </p>
          )}

          {/* Sub heading */}
          {content.subheading && (
            <h3 style={{
              fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
              fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
              fontWeight: 800,
              color: '#0f0e1a',
              marginBottom: '12px',
              lineHeight: 1.3,
            }}>
              {content.subheading}
            </h3>
          )}

          {/* Sub description */}
          {content.subDescription && (
            <p style={{
              fontSize: '1rem',
              color: '#4a4768',
              lineHeight: 1.8,
              marginBottom: '24px',
            }}>
              {content.subDescription}
            </p>
          )}

          {/* Checklist */}
          {content.checklistItems?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {content.checklistItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.4 }}
                  style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}
                >
                  {/* Pink circle with checkmark */}
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: `2px solid ${checkColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}>
                    <span className="material-symbols-outlined" style={{
                      fontSize: 18,
                      color: checkColor,
                      fontVariationSettings: "'FILL' 1",
                    }}>
                      check
                    </span>
                  </div>
                  <span style={{
                    fontSize: '1rem',
                    color: '#4a4768',
                    lineHeight: 1.7,
                    paddingTop: '6px',
                  }}>
                    {item}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
