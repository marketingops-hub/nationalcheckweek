'use client';

import { motion } from 'framer-motion';
import type { HowLifeSkillsGOBlockContent } from '@/types/homepage-blocks';

interface HowLifeSkillsGOBlockProps {
  content: HowLifeSkillsGOBlockContent;
  accentColor?: string;
}

export default function HowLifeSkillsGOBlock({ content, accentColor: globalAccent }: HowLifeSkillsGOBlockProps) {
  const { colors } = content;
  const useGlobal = colors?.useGlobalColors !== false;
  const headingColor = useGlobal ? '#0f0e1a' : (colors?.heading || '#0f0e1a');
  const textColor = useGlobal ? '#4a4768' : (colors?.textColor || '#4a4768');

  return (
    <section style={{ padding: '80px 20px', background: '#f8f9fa' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '48px', alignItems: 'center' }}>
          {/* Left Column: Text Content */}
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
              marginBottom: '24px',
              lineHeight: 1.2
            }}>
              {content.heading}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

          {/* Right Column: Image */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div style={{ 
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              background: '#fff'
            }}>
              {content.image ? (
                <img 
                  src={content.image} 
                  alt={content.heading}
                  style={{ 
                    width: '100%', 
                    height: 'auto',
                    display: 'block'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  paddingBottom: '75%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    color: '#fff'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 64, marginBottom: 16 }}>
                      image
                    </span>
                    <p style={{ fontSize: '1rem', opacity: 0.9 }}>Image placeholder</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
