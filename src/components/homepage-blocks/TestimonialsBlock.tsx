'use client';

import { motion } from 'framer-motion';

interface TestimonialsBlockProps {
  content: {
    heading: string;
    testimonials: Array<{ quote: string; author: string; role: string; avatar?: string }>;
    colors?: {
      useGlobalColors?: boolean;
      accentColor?: string;
    };
  };
  accentColor?: string;
}

export default function TestimonialsBlock({ content, accentColor: globalAccent }: TestimonialsBlockProps) {
  const { colors } = content;
  
  // Use block colors if override is enabled, otherwise use global colors
  const useGlobal = colors?.useGlobalColors !== false;
  const accentColor = useGlobal ? (globalAccent || '#29B8E8') : (colors?.accentColor || '#29B8E8');
  return (
    <section style={{ padding: '80px 20px', background: '#f8f9fa' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '48px' }}>{content.heading}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
          {content.testimonials.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} style={{ padding: '32px', background: '#fff', borderRadius: '12px', border: '1px solid #e4e2ec' }}>
              <p style={{ fontSize: '1.0625rem', lineHeight: 1.6, marginBottom: '24px', color: '#1e1b33' }}>"{t.quote}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {t.avatar && <div style={{ width: 48, height: 48, borderRadius: '50%', background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600 }}>{t.author[0]}</div>}
                <div>
                  <div style={{ fontWeight: 600, color: '#0f0e1a' }}>{t.author}</div>
                  <div style={{ fontSize: '0.875rem', color: '#7b78a0' }}>{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
