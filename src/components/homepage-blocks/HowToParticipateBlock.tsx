'use client';

import { motion } from 'framer-motion';
import HubSpotForm from '@/components/shared/HubSpotForm';
import type { HowToParticipateBlockContent } from '@/types/homepage-blocks';

interface HowToParticipateBlockProps {
  content: HowToParticipateBlockContent;
  accentColor?: string;
}

export default function HowToParticipateBlock({ content, accentColor: globalAccent }: HowToParticipateBlockProps) {
  const { colors } = content;
  const useGlobal = colors?.useGlobalColors !== false;
  const accentColor = useGlobal ? (globalAccent || '#29B8E8') : (colors?.accentColor || '#29B8E8');
  const headingColor = useGlobal ? '#0f0e1a' : (colors?.heading || '#0f0e1a');
  const textColor = useGlobal ? '#4a4768' : (colors?.textColor || '#4a4768');
  const bgColor = (content as HowToParticipateBlockContent & { backgroundColor?: string }).backgroundColor || '#E30982';

  return (
    <section style={{ padding: '80px 20px 0', background: bgColor }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
          {/* Left Column: How to Participate — white card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '40px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
            }}
          >
            <h2 style={{ 
              fontSize: '2rem', 
              fontWeight: 700, 
              color: headingColor,
              marginBottom: '20px'
            }}>
              {content.heading}
            </h2>
            
            <p style={{ 
              fontSize: '1rem', 
              color: textColor,
              lineHeight: 1.8,
              marginBottom: '28px'
            }}>
              {content.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {content.features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    alignItems: 'flex-start',
                    padding: '8px 0',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: accentColor, marginTop: '2px', flexShrink: 0 }}>
                    check_circle
                  </span>
                  <span style={{ fontSize: '0.9375rem', color: textColor, lineHeight: 1.6 }}>
                    {feature}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Registration Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div style={{ 
              background: '#fff', 
              padding: '40px', 
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}>
              {content.formHeading && (
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 700, 
                  color: headingColor,
                  marginBottom: '24px',
                  textAlign: 'center'
                }}>
                  {content.formHeading}
                </h3>
              )}
              
              {/* HubSpot Form Container */}
              {content.hubspotPortalId && content.hubspotFormId && (
                <HubSpotForm
                  portalId={content.hubspotPortalId}
                  formId={content.hubspotFormId}
                  region={content.hubspotRegion || 'ap1'}
                  lazy
                  lazyMargin="100px"
                />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
