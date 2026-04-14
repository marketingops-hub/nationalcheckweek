'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface RegisterPageData {
  id: string;
  heading: string;
  subheading: string | null;
  description: string | null;
  right_column_content: Array<{
    type: 'heading' | 'paragraph' | 'list';
    content?: string;
    items?: string[];
  }>;
  hubspot_form_id: string | null;
  hubspot_portal_id: string | null;
  background_color: string;
}

interface RegisterPageClientProps {
  pageData: RegisterPageData;
}

export default function RegisterPageClient({ pageData }: RegisterPageClientProps) {
  useEffect(() => {
    // Load HubSpot form script if form IDs are provided
    if (pageData.hubspot_form_id && pageData.hubspot_portal_id) {
      const script = document.createElement('script');
      script.src = '//js-ap1.hsforms.net/forms/embed/v2.js';
      script.charset = 'utf-8';
      script.type = 'text/javascript';
      script.async = true;
      
      script.onload = () => {
        if (window.hbspt && pageData.hubspot_portal_id && pageData.hubspot_form_id) {
          const formConfig: any = {
            region: 'ap1',
            portalId: pageData.hubspot_portal_id,
            formId: pageData.hubspot_form_id,
            target: '#hubspot-form-container',
            onFormSubmit: async function($form: any, data: any) {
              // Get form data from HubSpot's data parameter
              const fields: any = {};
              
              // HubSpot passes form data in the data parameter
              if (data && Array.isArray(data)) {
                data.forEach((field: any) => {
                  fields[field.name] = field.value;
                });
              }

              console.log('[Registration] Form submitted with fields:', fields);

              // Extract Zoom webinar IDs from bulk_zoom_registration field
              const webinarIds: string[] = [];
              
              // Check for bulk_zoom_registration field (HubSpot checkbox field)
              if (fields.bulk_zoom_registration) {
                const value = fields.bulk_zoom_registration;
                
                // Handle different formats: string, array, or semicolon-separated
                if (typeof value === 'string') {
                  // Split by semicolon (HubSpot checkbox format) or comma
                  const ids = value.split(/[;,]/).map((id: string) => id.trim()).filter(Boolean);
                  webinarIds.push(...ids);
                } else if (Array.isArray(value)) {
                  webinarIds.push(...value);
                }
              }

              console.log('[Registration] Extracted Zoom webinar IDs:', webinarIds);

              // Only call Zoom API if we have webinar IDs
              if (webinarIds.length > 0) {
                try {
                  const response = await fetch('/api/hubspot-zoom-register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      hubspot_form_id: pageData.hubspot_form_id,
                      zoom_webinar_ids: webinarIds,
                      fields: fields,
                      context: {
                        pageUri: window.location.href,
                        pageName: document.title,
                      },
                    }),
                  });
                  
                  const result = await response.json();
                  console.log('[Registration] Zoom registration response:', result);
                  
                  if (result.success) {
                    console.log('[Registration] ✅ Successfully registered for', webinarIds.length, 'webinar(s)');
                  } else {
                    console.error('[Registration] ❌ Zoom registration failed:', result);
                  }
                } catch (error) {
                  console.error('[Registration] ❌ Zoom registration error:', error);
                }
              } else {
                console.log('[Registration] No webinar IDs found in bulk_zoom_registration field');
              }
            }
          };
          window.hbspt.forms.create(formConfig);
        }
      };
      
      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [pageData.hubspot_form_id, pageData.hubspot_portal_id]);

  return (
    <>
      {/* Hero Section */}
      <div className="page-hero page-hero--centered">
        <div className="page-hero__inner">
          <div className="hero-tag">📝 Registration</div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="page-hero__title"
          >
            {pageData.heading}
          </motion.h1>
          
          {pageData.subheading && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="page-hero__subtitle"
            >
              {pageData.subheading}
            </motion.p>
          )}
          
          {pageData.description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ 
                fontSize: '1rem', 
                color: 'var(--color-text-muted)',
                marginTop: '1rem'
              }}
            >
              {pageData.description}
            </motion.p>
          )}
        </div>
      </div>

      {/* Two Column Section */}
      <main className="inner-content inner-content--wide" id="main-content">
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '48px',
          alignItems: 'start'
        }}>
          {/* Left Column: HubSpot Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              background: '#fff',
              padding: '40px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid var(--color-border)'
            }}
          >
            <div id="hubspot-form-container">
              {!pageData.hubspot_form_id || !pageData.hubspot_portal_id ? (
                <div style={{ padding: '40px', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#29B8E8', marginBottom: 16, display: 'block' }}>
                    description
                  </span>
                  <p style={{ color: '#7b78a0', fontSize: '0.9375rem' }}>
                    HubSpot form will appear here once configured in the admin panel.
                  </p>
                </div>
              ) : (
                <div style={{ minHeight: '400px' }}>
                  {/* HubSpot form loads here */}
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Column: Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
              {pageData.right_column_content.map((block, index) => {
                if (block.type === 'heading') {
                  return (
                    <h2 
                      key={index}
                      style={{ 
                        fontSize: '1.75rem', 
                        fontWeight: 700, 
                        color: '#0f0e1a',
                        marginBottom: '16px',
                        marginTop: index > 0 ? '32px' : 0
                      }}
                    >
                      {block.content}
                    </h2>
                  );
                }
                
                if (block.type === 'paragraph') {
                  return (
                    <p 
                      key={index}
                      style={{ 
                        fontSize: '1.0625rem', 
                        color: '#4a4768',
                        lineHeight: 1.8,
                        marginBottom: '16px'
                      }}
                    >
                      {block.content}
                    </p>
                  );
                }
                
                if (block.type === 'list' && block.items) {
                  return (
                    <ul 
                      key={index}
                      style={{ 
                        marginBottom: '24px',
                        paddingLeft: 0,
                        listStyle: 'none'
                      }}
                    >
                      {block.items.map((item, i) => (
                        <li 
                          key={i}
                          style={{ 
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start',
                            marginBottom: '12px',
                            fontSize: '1.0625rem',
                            color: '#4a4768',
                            lineHeight: 1.6
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#29B8E8', marginTop: '2px' }}>
                            check_circle
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }
                
                return null;
              })}
            </motion.div>
          </div>
      </main>
    </>
  );
}
