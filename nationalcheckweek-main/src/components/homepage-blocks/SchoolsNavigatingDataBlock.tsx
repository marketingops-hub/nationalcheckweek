'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface Issue {
  icon: string;
  title: string;
  description: string;
  stat: string;
  statLabel: string;
}

interface SchoolsNavigatingDataBlockProps {
  content: {
    heading: string;
    subheading: string;
    issues: Issue[];
    ctaText: string;
    ctaLink: string;
    backgroundColor?: string;
    accentColor?: string;
  };
  accentColor?: string;
}

export default function SchoolsNavigatingDataBlock({ content, accentColor: globalAccent }: SchoolsNavigatingDataBlockProps) {
  const {
    heading,
    subheading,
    issues,
    ctaText,
    ctaLink,
    backgroundColor = '#f8f9fa',
    accentColor = globalAccent || '#29B8E8',
  } = content;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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

        {/* Issues Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '48px',
          }}
        >
          {issues.map((issue, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(89, 37, 244, 0.12)' }}
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '32px',
                border: '1px solid #e4e2ec',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: `${accentColor}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 28, color: accentColor }}
                >
                  {issue.icon}
                </span>
              </div>

              {/* Title */}
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#0f0e1a',
                  marginBottom: '12px',
                }}
              >
                {issue.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontSize: '0.9375rem',
                  color: '#4a4768',
                  lineHeight: 1.6,
                  marginBottom: '20px',
                }}
              >
                {issue.description}
              </p>

              {/* Stat */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '8px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e4e2ec',
                }}
              >
                <span
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: accentColor,
                  }}
                >
                  {issue.stat}
                </span>
                <span
                  style={{
                    fontSize: '0.875rem',
                    color: '#7b78a0',
                  }}
                >
                  {issue.statLabel}
                </span>
              </div>
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
              arrow_forward
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
