'use client';

import { motion } from 'framer-motion';

interface StatsBlockProps {
  content: {
    stats: Array<{ value: string; label: string }>;
    colors?: {
      useGlobalColors?: boolean;
      accentColor?: string;
    };
  };
  accentColor?: string;
}

export default function StatsBlock({ content, accentColor: globalAccent }: StatsBlockProps) {
  const { colors } = content;
  
  // Use block colors if override is enabled, otherwise use global colors
  const useGlobal = colors?.useGlobalColors !== false;
  const accentColor = useGlobal ? (globalAccent || '#29B8E8') : (colors?.accentColor || '#29B8E8');
  return (
    <section style={{ padding: '60px 20px', background: '#f8f9fa' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
        {content.stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: accentColor, marginBottom: '8px' }}>{stat.value}</div>
            <div style={{ fontSize: '1rem', color: '#4a4768' }}>{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
