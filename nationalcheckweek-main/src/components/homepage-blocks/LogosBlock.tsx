'use client';

import { motion } from 'framer-motion';

interface LogosBlockProps {
  content: {
    heading: string;
    logos: Array<{ name: string; url: string }>;
  };
}

export default function LogosBlock({ content }: LogosBlockProps) {
  return (
    <section style={{ padding: '60px 20px', background: '#f8f9fa' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '40px', color: '#4a4768' }}>{content.heading}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '48px', alignItems: 'center' }}>
          {content.logos.map((logo, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} style={{ fontSize: '1rem', fontWeight: 500, color: '#7b78a0' }}>
              {logo.name}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
