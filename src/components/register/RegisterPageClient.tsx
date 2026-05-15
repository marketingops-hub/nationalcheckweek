'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import HubSpotForm from '@/components/shared/HubSpotForm';

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

/**
 * Extract Zoom webinar IDs from HubSpot submission data and register the user.
 */
async function handleZoomRegistration(
  hubspotFormId: string,
  data: Record<string, unknown>,
) {
  const fields: Record<string, string> = {};
  if (data && Array.isArray(data)) {
    (data as Array<{ name: string; value: string }>).forEach((field) => {
      fields[field.name] = field.value;
    });
  }

  const webinarIds: string[] = [];
  if (fields.bulk_zoom_registration) {
    // HubSpot checkbox values are semicolon-separated strings
    const value: unknown = fields.bulk_zoom_registration;
    if (typeof value === 'string') {
      webinarIds.push(...value.split(/[;,]/).map((id) => id.trim()).filter(Boolean));
    } else if (Array.isArray(value)) {
      webinarIds.push(...(value as string[]));
    }
  }

  if (webinarIds.length === 0) return;

  try {
    const response = await fetch('/api/hubspot-zoom-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hubspot_form_id: hubspotFormId,
        zoom_webinar_ids: webinarIds,
        fields,
        context: {
          pageUri: window.location.href,
          pageName: document.title,
        },
      }),
    });
    const result = await response.json();
    if (!result.success) {
      console.error('[Registration] Zoom registration failed:', result);
    }
  } catch (error) {
    console.error('[Registration] Zoom registration error:', error);
  }
}

export default function RegisterPageClient({ pageData }: RegisterPageClientProps) {
  const handleFormSubmit = useCallback(
    (_$form: HTMLFormElement, data: Record<string, unknown>) => {
      if (pageData.hubspot_form_id) {
        handleZoomRegistration(pageData.hubspot_form_id, data);
      }
    },
    [pageData.hubspot_form_id],
  );

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
            {pageData.hubspot_form_id && pageData.hubspot_portal_id ? (
              <HubSpotForm
                portalId={pageData.hubspot_portal_id}
                formId={pageData.hubspot_form_id}
                containerId="hubspot-form-container"
                onFormSubmit={handleFormSubmit}
              />
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', background: '#f8f9fa', borderRadius: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#29B8E8', marginBottom: 16, display: 'block' }}>
                  description
                </span>
                <p style={{ color: '#7b78a0', fontSize: '0.9375rem' }}>
                  HubSpot form will appear here once configured in the admin panel.
                </p>
              </div>
            )}
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
