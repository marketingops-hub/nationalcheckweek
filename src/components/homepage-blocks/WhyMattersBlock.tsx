'use client';

import { motion } from 'framer-motion';
import type { WhyMattersBlockContent } from '@/types/homepage-blocks';

interface WhyMattersBlockProps {
  content: WhyMattersBlockContent;
  accentColor?: string;
}

export default function WhyMattersBlock({ content, accentColor: globalAccent }: WhyMattersBlockProps) {
  const { colors } = content;
  const useGlobal = colors?.useGlobalColors !== false;
  const accentColor = useGlobal ? (globalAccent || '#29B8E8') : (colors?.accentColor || '#29B8E8');
  const headingColor = useGlobal ? '#0f0e1a' : (colors?.heading || '#0f0e1a');
  const textColor = useGlobal ? '#4a4768' : (colors?.textColor || '#4a4768');

  return (
    <section style={{ padding: '80px 20px', background: '#f0f4f8' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '48px' }}
        >
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 700, 
            color: headingColor,
            marginBottom: '16px'
          }}>
            {content.heading}
          </h2>
          <p style={{ 
            fontSize: '1.0625rem', 
            color: textColor,
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            {content.subheading}
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }}>
          {content.cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              style={{
                background: '#fff',
                padding: '32px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}
            >
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: '50%', 
                background: `${accentColor}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: accentColor }}>
                  {card.icon}
                </span>
              </div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 600, 
                color: headingColor,
                marginBottom: '12px'
              }}>
                {card.title}
              </h3>
              <p style={{ 
                fontSize: '0.9375rem', 
                color: textColor,
                lineHeight: 1.6
              }}>
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
