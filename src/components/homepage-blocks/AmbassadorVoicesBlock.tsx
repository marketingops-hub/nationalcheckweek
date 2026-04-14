'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface AmbassadorVoice {
  id: string;
  name: string;
  title: string | null;
  photoUrl: string | null;
  comment: string | null;
  event_link: string | null;
}

interface AmbassadorVoicesBlockContent {
  heading?: string;
  description?: string;
  buttonText?: string;
  buttonColor?: string;
}

interface Props {
  content: AmbassadorVoicesBlockContent;
  accentColor?: string;
  initialAmbassadors?: Record<string, unknown>[];
}

export default function AmbassadorVoicesBlock({ content, accentColor = '#29B8E8', initialAmbassadors }: Props) {
  const [ambassadors, setAmbassadors] = useState<AmbassadorVoice[]>((initialAmbassadors as AmbassadorVoice[] | undefined) ?? []);
  const [loading, setLoading] = useState(!initialAmbassadors);

  const heading = content.heading || 'A national movement driving change in student wellbeing';
  const description = content.description || 'National Check-In Week is bringing together ambassadors, partners, experts, and organisations, such as those below, with a shared determination to shift the national conversation on student wellbeing. Together, they are raising visibility, strengthening understanding, and driving the collective action needed to create meaningful change for young people across Australia.';
  const buttonText = content.buttonText || 'Register for events I\'m involved in here';
  const buttonColor = content.buttonColor || '#29B8E8';

  useEffect(() => {
    if (initialAmbassadors) return;
    fetch('/api/ambassador-voices')
      .then(r => r.json())
      .then(d => setAmbassadors(d.ambassadors ?? []))
      .catch(() => setAmbassadors([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section style={{ padding: '80px 20px', background: '#f8fafc' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '64px' }}
        >
          <h2 style={{
            fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
            fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
            fontWeight: 800,
            color: '#0f0e1a',
            marginBottom: '20px',
            lineHeight: 1.2,
          }}>
            {heading}
          </h2>
          <p style={{
            fontSize: '1.0625rem',
            color: '#4a4768',
            lineHeight: 1.8,
            maxWidth: '820px',
            margin: '0 auto',
          }}>
            {description}
          </p>
        </motion.div>

        {/* Ambassador Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
            Loading ambassadors...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {ambassadors.map((ambassador, i) => {
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={ambassador.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  style={{
                    background: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
                    padding: '32px 40px',
                    display: 'grid',
                    gridTemplateColumns: isLeft ? '120px 1fr' : '1fr 120px',
                    gap: '32px',
                    alignItems: 'start',
                  }}
                >
                  {/* Photo - left side for even, right side for odd */}
                  {isLeft && (
                    <AmbassadorPhoto ambassador={ambassador} accentColor={accentColor} />
                  )}

                  {/* Content */}
                  <div>
                    <h3 style={{
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: '#0f0e1a',
                      marginBottom: '4px',
                    }}>
                      {ambassador.name}
                    </h3>
                    {ambassador.title && (
                      <p style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: '16px',
                      }}>
                        {ambassador.title}
                      </p>
                    )}
                    {ambassador.comment && (
                      <div style={{
                        fontSize: '0.9375rem',
                        color: '#374151',
                        lineHeight: 1.75,
                        marginBottom: '24px',
                      }}>
                        {ambassador.comment.split('\n').map((line, idx) => (
                          line.trim() ? (
                            <p key={idx} style={{ margin: '0 0 12px 0' }}>{line}</p>
                          ) : null
                        ))}
                      </div>
                    )}
                    {ambassador.event_link && (
                      <a
                        href={ambassador.event_link}
                        style={{
                          display: 'inline-block',
                          background: buttonColor,
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          padding: '12px 28px',
                          borderRadius: '9999px',
                          textDecoration: 'none',
                          transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                      >
                        {buttonText}
                      </a>
                    )}
                  </div>

                  {/* Photo - right side for odd */}
                  {!isLeft && (
                    <AmbassadorPhoto ambassador={ambassador} accentColor={accentColor} />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function AmbassadorPhoto({ ambassador, accentColor }: { ambassador: AmbassadorVoice; accentColor: string }) {
  return (
    <div style={{
      width: 120,
      height: 120,
      borderRadius: '50%',
      overflow: 'hidden',
      background: '#e4e2ec',
      flexShrink: 0,
    }}>
      {ambassador.photoUrl ? (
        <Image
          src={ambassador.photoUrl}
          alt={ambassador.name}
          width={120}
          height={120}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          unoptimized
        />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '3rem', color: accentColor,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 56 }}>person</span>
        </div>
      )}
    </div>
  );
}
