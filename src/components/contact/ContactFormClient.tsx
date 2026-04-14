'use client';

import HubSpotForm from '@/components/shared/HubSpotForm';

export default function ContactFormClient() {
  return (
    <div style={{
      marginBottom: '4rem',
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '2.5rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}>
      <h2 style={{
        fontFamily: 'var(--font-montserrat)',
        fontSize: '1.75rem',
        fontWeight: 800,
        marginBottom: '1rem',
        color: '#1a1a2e',
        textAlign: 'center'
      }}>
        Send Us a Message
      </h2>
      <p style={{
        textAlign: 'center',
        color: '#64748b',
        marginBottom: '2rem',
        fontSize: '0.9375rem'
      }}>
        Fill out the form below and we&apos;ll get back to you as soon as possible
      </p>
      <HubSpotForm
        portalId="4596264"
        formId="24feba89-1af4-479a-a43c-56e97bb67520"
        containerId="hubspot-contact-form"
      />
    </div>
  );
}
