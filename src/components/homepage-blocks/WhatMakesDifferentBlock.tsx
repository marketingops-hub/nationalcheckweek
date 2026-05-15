'use client';

import { motion } from 'framer-motion';
import type { WhatMakesDifferentBlockContent } from '@/types/homepage-blocks';

interface WhatMakesDifferentBlockProps {
  content: WhatMakesDifferentBlockContent;
  accentColor?: string;
}

export default function WhatMakesDifferentBlock({ content, accentColor: globalAccent }: WhatMakesDifferentBlockProps) {
  const { colors } = content;
  const useGlobal = colors?.useGlobalColors !== false;
  const headingColor = useGlobal ? '#0f0e1a' : (colors?.heading || '#0f0e1a');
  const textColor = useGlobal ? '#4a4768' : (colors?.textColor || '#4a4768');

  return (
    <section style={{ padding: '80px 20px', background: '#fff' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 700, 
            color: headingColor,
            marginBottom: '32px',
            textAlign: 'center'
          }}>
            {content.heading}
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {content.paragraphs.map((paragraph, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                style={{ 
                  fontSize: '1.0625rem', 
                  color: textColor,
                  lineHeight: 1.8
                }}
              >
                {paragraph}
              </motion.p>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
