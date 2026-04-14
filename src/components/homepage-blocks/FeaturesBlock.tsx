'use client';

import { motion } from 'framer-motion';

interface FeaturesBlockProps {
  content: {
    heading: string;
    features: Array<{ icon: string; title: string; description: string }>;
    colors?: {
      useGlobalColors?: boolean;
      accentColor?: string;
    };
  };
  accentColor?: string;
}

export default function FeaturesBlock({ content, accentColor: globalAccent }: FeaturesBlockProps) {
  const { colors } = content;
  
  // Use block colors if override is enabled, otherwise use global colors
  const useGlobal = colors?.useGlobalColors !== false;
  const accentColor = useGlobal ? (globalAccent || '#29B8E8') : (colors?.accentColor || '#29B8E8');
  return (
    <section style={{ padding: '80px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '48px' }}>{content.heading}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          {content.features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} style={{ padding: '32px', background: '#f8f9fa', borderRadius: '12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: accentColor, marginBottom: '16px', display: 'block' }}>{f.icon}</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>{f.title}</h3>
              <p style={{ color: '#4a4768' }}>{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
