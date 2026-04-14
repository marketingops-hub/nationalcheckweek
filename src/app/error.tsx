'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: '#F8FAFC'
    }}>
      <div style={{
        maxWidth: '500px',
        textAlign: 'center',
        background: '#fff',
        padding: '3rem 2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0B1D35', marginBottom: '1rem' }}>
          Something went wrong
        </h2>
        <p style={{ color: '#64748B', marginBottom: '2rem', lineHeight: 1.6 }}>
          We encountered an unexpected error. Our team has been notified.
        </p>
        <button
          onClick={reset}
          style={{
            background: '#1C7ED6',
            color: '#fff',
            padding: '0.75rem 2rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
