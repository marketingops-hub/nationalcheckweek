'use client';

import { useEffect } from 'react';

export default function ContactFormClient() {
  useEffect(() => {
    // Load HubSpot form script
    const script = document.createElement('script');
    script.src = 'https://js-ap1.hsforms.net/forms/embed/4596264.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.hbspt) {
        window.hbspt.forms.create({
          region: 'ap1',
          portalId: '4596264',
          formId: '24feba89-1af4-479a-a43c-56e97bb67520',
          target: '#hubspot-contact-form'
        });
      }
    };
    
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

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
        Fill out the form below and we'll get back to you as soon as possible
      </p>
      <div id="hubspot-contact-form"></div>
    </div>
  );
}
