'use client';

import { motion } from 'framer-motion';
import type { WhatAndWhoBlockContent } from '@/types/homepage-blocks';

interface WhatAndWhoBlockProps {
  content: WhatAndWhoBlockContent;
  accentColor?: string;
}

export default function WhatAndWhoBlock({ content, accentColor: globalAccent }: WhatAndWhoBlockProps) {
  const { colors } = content;
  const useGlobal = colors?.useGlobalColors !== false;
  const accentColor = useGlobal ? (globalAccent || '#29B8E8') : (colors?.accentColor || '#29B8E8');
  const headingColor = useGlobal ? '#0f0e1a' : (colors?.heading || '#0f0e1a');
  const textColor = useGlobal ? '#4a4768' : (colors?.textColor || '#4a4768');

  return (
    <section style={{ padding: '80px 20px', background: '#fff' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '48px', marginBottom: '64px' }}>
          {/* Column 1: Who You'll Hear From */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 style={{ 
              fontSize: '2rem', 
              fontWeight: 700, 
              color: headingColor,
              marginBottom: '24px'
            }}>
              {content.column1Heading}
            </h2>
            <p style={{ 
              fontSize: '1.0625rem', 
              color: textColor,
              lineHeight: 1.8,
              marginBottom: '32px'
            }}>
              {content.column1Description}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {content.column1Tags.map((tag, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  style={{
                    padding: '10px 20px',
                    background: `${accentColor}15`,
                    color: accentColor,
                    borderRadius: '6px',
                    fontSize: '0.9375rem',
                    fontWeight: 500
                  }}
                >
                  {tag}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Column 2: What You'll Access */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 style={{ 
              fontSize: '2rem', 
              fontWeight: 700, 
              color: headingColor,
              marginBottom: '24px'
            }}>
              {content.column2Heading}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {content.column2Items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: accentColor, marginTop: '2px' }}>
                    check_circle
                  </span>
                  <span style={{ fontSize: '1.0625rem', color: textColor, lineHeight: 1.6 }}>
                    {item}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* CTA Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}
        >
          <blockquote style={{ 
            fontSize: '1.5rem', 
            fontWeight: 600, 
            lineHeight: 1.5,
            margin: 0
          }}>
            {content.ctaQuote.split('\n').map((line, i) => (
              <div key={i} style={{ 
                color: i === 0 ? accentColor : i === 1 ? '#E91E63' : headingColor,
                marginBottom: i < 2 ? '8px' : 0
              }}>
                {line}
              </div>
            ))}
          </blockquote>
        </motion.div>
      </div>
    </section>
  );
}
