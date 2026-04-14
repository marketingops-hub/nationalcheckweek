'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface StateData {
  name: string;
  code: string;
  color: string;
  stats: {
    schools: string;
    students: string;
    programs: string;
  };
  highlights: string[];
  link: string;
}

interface WellbeingAcrossAustraliaBlockProps {
  content: {
    heading: string;
    subheading: string;
    states: StateData[];
    ctaText: string;
    ctaLink: string;
    showMap?: boolean;
    backgroundColor?: string;
    accentColor?: string;
  };
  accentColor?: string;
}

export default function WellbeingAcrossAustraliaBlock({ content, accentColor: globalAccent }: WellbeingAcrossAustraliaBlockProps) {
  const {
    heading,
    subheading,
    states,
    ctaText,
    ctaLink,
    backgroundColor = '#ffffff',
    accentColor = globalAccent || '#29B8E8',
  } = content;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section
      style={{
        backgroundColor,
        padding: '80px 20px',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: '60px' }}
        >
          <h2
            style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#0f0e1a',
              marginBottom: '16px',
              lineHeight: 1.2,
            }}
          >
            {heading}
          </h2>
          <p
            style={{
              fontSize: '1.125rem',
              color: '#4a4768',
              maxWidth: '700px',
              margin: '0 auto',
            }}
          >
            {subheading}
          </p>
        </motion.div>

        {/* States Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '48px',
          }}
        >
          {states.map((state, index) => (
            <motion.div
              key={state.code}
              variants={itemVariants}
              whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)' }}
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '28px',
                border: '1px solid #e4e2ec',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* State Color Bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: state.color,
                }}
              />

              {/* State Code Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  background: `${state.color}15`,
                  marginBottom: '16px',
                }}
              >
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: state.color,
                  }}
                >
                  {state.code}
                </span>
              </div>

              {/* State Name */}
              <h3
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#0f0e1a',
                  marginBottom: '16px',
                }}
              >
                {state.name}
              </h3>

              {/* Stats */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  marginBottom: '20px',
                  paddingBottom: '20px',
                  borderBottom: '1px solid #e4e2ec',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: accentColor,
                    }}
                  >
                    {state.stats.schools}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#7b78a0',
                      marginTop: '4px',
                    }}
                  >
                    Schools
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: accentColor,
                    }}
                  >
                    {state.stats.students}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#7b78a0',
                      marginTop: '4px',
                    }}
                  >
                    Students
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: accentColor,
                    }}
                  >
                    {state.stats.programs}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#7b78a0',
                      marginTop: '4px',
                    }}
                  >
                    Programs
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div style={{ marginBottom: '16px' }}>
                {state.highlights.map((highlight, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      marginBottom: '8px',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 16,
                        color: accentColor,
                        marginTop: '2px',
                      }}
                    >
                      check_circle
                    </span>
                    <span
                      style={{
                        fontSize: '0.875rem',
                        color: '#4a4768',
                        lineHeight: 1.5,
                      }}
                    >
                      {highlight}
                    </span>
                  </div>
                ))}
              </div>

              {/* Link */}
              <Link
                href={state.link}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: accentColor,
                  textDecoration: 'none',
                  transition: 'gap 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.gap = '8px';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.gap = '4px';
                }}
              >
                Learn more
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  arrow_forward
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ textAlign: 'center' }}
        >
          <Link
            href={ctaLink}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '16px 32px',
              background: accentColor,
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(89, 37, 244, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {ctaText}
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              explore
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
