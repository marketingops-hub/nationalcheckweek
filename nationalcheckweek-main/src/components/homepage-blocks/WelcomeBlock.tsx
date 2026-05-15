'use client';

import { motion } from 'framer-motion';
import type { WelcomeBlockContent } from '@/types/homepage-blocks';

interface WelcomeBlockProps {
  content: WelcomeBlockContent;
  accentColor?: string;
}

export default function WelcomeBlock({ content, accentColor: globalAccent }: WelcomeBlockProps) {
  const { colors } = content;
  const useGlobal = colors?.useGlobalColors !== false;
  const accentColor = useGlobal ? (globalAccent || '#29B8E8') : (colors?.accentColor || '#29B8E8');
  const headingColor = useGlobal ? (globalAccent || '#0f0e1a') : (colors?.heading || '#0f0e1a');
  const textColor = useGlobal ? '#4a4768' : (colors?.textColor || '#4a4768');

  return (
    <section style={{ padding: '80px 20px', background: '#fff' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p style={{ 
            fontSize: '0.875rem', 
            fontWeight: 600, 
            color: accentColor, 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em',
            marginBottom: '16px'
          }}>
            {content.eyebrow}
          </p>
          
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 700, 
            color: headingColor,
            marginBottom: '24px',
            lineHeight: 1.2
          }}>
            {content.heading}
          </h2>
          
          <p style={{ 
            fontSize: '1.25rem', 
            color: textColor,
            marginBottom: '32px',
            lineHeight: 1.6,
            maxWidth: '900px',
            margin: '0 auto 32px'
          }}>
            {content.description}
          </p>
          
          <p style={{ 
            fontSize: '1rem', 
            color: textColor,
            lineHeight: 1.8,
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            {content.longDescription}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
