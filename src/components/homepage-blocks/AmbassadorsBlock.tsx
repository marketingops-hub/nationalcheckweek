'use client';

import { motion } from 'framer-motion';
import type { AmbassadorsBlockContent } from '@/types/homepage-blocks';

interface AmbassadorsBlockProps {
  content: AmbassadorsBlockContent;
  accentColor?: string;
}

export default function AmbassadorsBlock({ content, accentColor: globalAccent }: AmbassadorsBlockProps) {
  const { colors } = content;
  const useGlobal = colors?.useGlobalColors !== false;
  const headingColor = useGlobal ? '#0f0e1a' : (colors?.heading || '#0f0e1a');
  const textColor = useGlobal ? '#4a4768' : (colors?.textColor || '#4a4768');
  const accentColor = useGlobal ? (globalAccent || '#29B8E8') : (colors?.accentColor || '#29B8E8');

  return (
    <section style={{ padding: '80px 20px', background: '#fff' }}>
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
            marginBottom: '24px',
            lineHeight: 1.2
          }}>
            {content.heading}
          </h2>
          
          <p style={{ 
            fontSize: '1.0625rem', 
            color: textColor,
            lineHeight: 1.8,
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            {content.description}
          </p>
        </motion.div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
          gap: '32px',
          marginTop: '48px'
        }}>
          {content.ambassadors.map((ambassador, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              style={{
                textAlign: 'center',
                padding: '24px',
                background: '#f8f9fa',
                borderRadius: '12px',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                overflow: 'hidden',
                margin: '0 auto 16px',
                border: `3px solid ${accentColor}`,
                background: '#e4e2ec'
              }}>
                {ambassador.image ? (
                  <img 
                    src={ambassador.image} 
                    alt={ambassador.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '3rem',
                    color: accentColor
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 48 }}>
                      person
                    </span>
                  </div>
                )}
              </div>
              
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: 600, 
                color: headingColor,
                marginBottom: '4px'
              }}>
                {ambassador.name}
              </h3>
              
              <p style={{ 
                fontSize: '0.875rem', 
                color: accentColor,
                fontWeight: 500,
                marginBottom: ambassador.bio ? '12px' : 0
              }}>
                {ambassador.title}
              </p>
              
              {ambassador.bio && (
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: textColor,
                  lineHeight: 1.5
                }}>
                  {ambassador.bio}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
