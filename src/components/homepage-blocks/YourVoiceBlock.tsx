'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { YourVoiceBlockContent } from '@/types/homepage-blocks';

interface YourVoiceBlockProps {
  content: YourVoiceBlockContent;
  accentColor?: string;
}

export default function YourVoiceBlock({ content, accentColor: globalAccent }: YourVoiceBlockProps) {
  const { colors } = content;
  const useGlobal = colors?.useGlobalColors !== false;
  
  // Use global accent color or fallback to default
  const accent = useGlobal ? (globalAccent || '#29B8E8') : (colors?.accentColor || '#29B8E8');
  const bgColor = useGlobal ? '#0B1D35' : (colors?.backgroundColor || '#0B1D35');
  const textColor = useGlobal ? '#FFFFFF' : (colors?.textColor || '#FFFFFF');
  const buttonBg = useGlobal ? (globalAccent || '#29B8E8') : (colors?.primaryButton || '#29B8E8');
  const buttonText = useGlobal ? '#FFFFFF' : (colors?.primaryButtonText || '#FFFFFF');

  return (
    <section style={{ padding: '100px 20px', background: bgColor }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Accent eyebrow */}
          <div style={{ 
            fontSize: '0.875rem', 
            fontWeight: 600, 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em', 
            marginBottom: '16px',
            color: accent
          }}>
            {content.eyebrow || 'We Need Your Help'}
          </div>
          
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 700, 
            color: textColor,
            marginBottom: '24px',
            lineHeight: 1.2
          }}>
            {content.heading || 'Let Your Voice Be Heard'}
          </h2>
          
          <p style={{ 
            fontSize: '1.125rem', 
            color: textColor,
            lineHeight: 1.8,
            marginBottom: '40px',
            opacity: 0.9,
            maxWidth: '700px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            {content.description || 'At National Check Week, we need your opinion to help us find the best solution. Join the conversation and make a difference in student wellbeing across Australia.'}
          </p>

          <Link
            href={content.ctaLink || '/your-voice'}
            style={{
              display: 'inline-block',
              padding: '18px 48px',
              background: buttonBg,
              color: buttonText,
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '1.0625rem',
              textDecoration: 'none',
              border: `2px solid ${buttonBg}`,
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
          >
            {content.ctaText || 'Join the Conversation'}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
