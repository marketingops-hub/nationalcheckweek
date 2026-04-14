'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { WhatIsItBlockContent } from '@/types/homepage-blocks';

interface WhatIsItBlockProps {
  content: WhatIsItBlockContent;
  accentColor?: string;
}

export default function WhatIsItBlock({ content, accentColor: globalAccent }: WhatIsItBlockProps) {
  const [loadVideo, setLoadVideo] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setLoadVideo(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );

    observer.observe(videoRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);
  const { colors } = content;
  const useGlobal = colors?.useGlobalColors !== false;
  const accentColor = useGlobal ? (globalAccent || '#29B8E8') : (colors?.accentColor || '#29B8E8');
  const headingColor = useGlobal ? '#0f0e1a' : (colors?.heading || '#0f0e1a');
  const textColor = useGlobal ? '#4a4768' : (colors?.textColor || '#4a4768');
  const buttonBg = useGlobal ? (globalAccent || '#29B8E8') : (colors?.primaryButton || '#29B8E8');
  const buttonText = useGlobal ? '#FFFFFF' : (colors?.primaryButtonText || '#FFFFFF');

  return (
    <section style={{ padding: '80px 20px', background: '#f8f9fa' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '48px', alignItems: 'center' }}>
          {/* Video Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            ref={videoRef}
          >
            <div style={{ 
              position: 'relative', 
              paddingBottom: '56.25%', 
              height: 0, 
              overflow: 'hidden',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              background: '#e9ecef'
            }}>
              {loadVideo ? (
                <iframe
                  src={content.vimeoUrl}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 0
                  }}
                  allow="autoplay; fullscreen; picture-in-picture"
                  title="Video"
                  loading="lazy"
                />
              ) : (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: '#6c757d',
                  fontSize: '0.875rem'
                }}>
                  Loading video...
                </div>
              )}
            </div>
          </motion.div>

          {/* Text Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
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
            
            <p style={{ 
              fontSize: '1.0625rem', 
              color: textColor,
              lineHeight: 1.8,
              marginBottom: '32px'
            }}>
              {content.description}
            </p>

            <a
              href={content.ctaLink}
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: buttonBg,
                color: buttonText,
                borderRadius: '8px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxShadow: '0 4px 12px rgba(41, 184, 232, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(41, 184, 232, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(41, 184, 232, 0.3)';
              }}
            >
              {content.ctaText}
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
