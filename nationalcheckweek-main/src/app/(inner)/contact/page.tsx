import Link from "next/link";
import ContactFormClient from "@/components/contact/ContactFormClient";

export const metadata = {
  title: "Contact Us — National Check-in Week",
  description: "Get in touch with the National Check-in Week team. We're here to support your school's wellbeing journey.",
};

export default function ContactPage() {
  return (
    <>
      <div className="page-hero page-hero--centered">
        <div className="page-hero__inner">
          <div className="hero-tag">💬 Get in Touch</div>
          <h1 className="page-hero__title">Contact Us</h1>
          <p className="page-hero__subtitle">
            Have questions about National Check-in Week? We're here to help your school
            participate in this important student wellbeing initiative.
          </p>
        </div>
      </div>

      <main className="inner-content" id="main-content">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            {/* Email */}
            <div style={{
              padding: '2rem',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                fontSize: '2rem', 
                marginBottom: '1rem',
                color: '#29B8E8'
              }}>
                ✉️
              </div>
              <h3 style={{ 
                fontFamily: 'var(--font-montserrat)', 
                fontSize: '1.25rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
                color: '#1a1a2e'
              }}>
                Email Us
              </h3>
              <p style={{ 
                color: '#64748b',
                marginBottom: '1rem',
                fontSize: '0.9375rem'
              }}>
                For general inquiries and support
              </p>
              <a 
                href="mailto:events@nationalcheckinweek.com"
                style={{
                  color: '#29B8E8',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: '0.9375rem'
                }}
              >
                events@nationalcheckinweek.com
              </a>
            </div>

            {/* Phone */}
            <div style={{
              padding: '2rem',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                fontSize: '2rem', 
                marginBottom: '1rem',
                color: '#29B8E8'
              }}>
                📞
              </div>
              <h3 style={{ 
                fontFamily: 'var(--font-montserrat)', 
                fontSize: '1.25rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
                color: '#1a1a2e'
              }}>
                Call Us
              </h3>
              <p style={{ 
                color: '#64748b',
                marginBottom: '1rem',
                fontSize: '0.9375rem'
              }}>
                Monday to Friday, 9am - 5pm AEST
              </p>
              <a 
                href="tel:1300889018"
                style={{
                  color: '#29B8E8',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: '0.9375rem'
                }}
              >
                1300 889 018
              </a>
            </div>

            {/* Address */}
            <div style={{
              padding: '2rem',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                fontSize: '2rem', 
                marginBottom: '1rem',
                color: '#29B8E8'
              }}>
                �
              </div>
              <h3 style={{ 
                fontFamily: 'var(--font-montserrat)', 
                fontSize: '1.25rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
                color: '#1a1a2e'
              }}>
                Visit Us
              </h3>
              <p style={{ 
                color: '#64748b',
                marginBottom: '1rem',
                fontSize: '0.9375rem'
              }}>
                Our office location
              </p>
              <p style={{
                color: '#29B8E8',
                fontWeight: 600,
                fontSize: '0.9375rem',
                lineHeight: 1.6
              }}>
                4/597 Darling Street,<br />Rozelle NSW 2039,<br />Australia
              </p>
            </div>
          </div>

          {/* HubSpot Contact Form */}
          <ContactFormClient />

          {/* FAQ Section */}
          <div style={{
            background: '#fff',
            padding: '2.5rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            marginBottom: '2rem'
          }}>
            <h2 style={{
              fontFamily: 'var(--font-montserrat)',
              fontSize: '1.75rem',
              fontWeight: 800,
              marginBottom: '1.5rem',
              color: '#1a1a2e'
            }}>
              Frequently Asked Questions
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 style={{
                  fontFamily: 'var(--font-montserrat)',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  marginBottom: '0.5rem',
                  color: '#1a1a2e'
                }}>
                  What is National Check-in Week?
                </h3>
                <p style={{ color: '#64748b', lineHeight: 1.7, fontSize: '0.9375rem' }}>
                  National Check-in Week (NCIW) is a FREE initiative tackling the student wellbeing 
                  crisis in Australian schools. We provide free webinars, expert panels, and resources 
                  to support your whole school community.
                </p>
              </div>

              <div>
                <h3 style={{
                  fontFamily: 'var(--font-montserrat)',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  marginBottom: '0.5rem',
                  color: '#1a1a2e'
                }}>
                  How can my school participate?
                </h3>
                <p style={{ color: '#64748b', lineHeight: 1.7, fontSize: '0.9375rem' }}>
                  Registration is simple and free! Visit our{' '}
                  <Link href="/register" style={{ color: '#29B8E8', fontWeight: 600 }}>
                    registration page
                  </Link>{' '}
                  to sign up your school and access all available resources and events.
                </p>
              </div>

              <div>
                <h3 style={{
                  fontFamily: 'var(--font-montserrat)',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  marginBottom: '0.5rem',
                  color: '#1a1a2e'
                }}>
                  When is National Check-in Week 2026?
                </h3>
                <p style={{ color: '#64748b', lineHeight: 1.7, fontSize: '0.9375rem' }}>
                  National Check-in Week 2026 will be held from May 25-29, 2026. Mark your calendars 
                  and register early to ensure your school doesn't miss out!
                </p>
              </div>

              <div>
                <h3 style={{
                  fontFamily: 'var(--font-montserrat)',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  marginBottom: '0.5rem',
                  color: '#1a1a2e'
                }}>
                  Is there a cost to participate?
                </h3>
                <p style={{ color: '#64748b', lineHeight: 1.7, fontSize: '0.9375rem' }}>
                  No! National Check-in Week is completely FREE for all Australian schools. 
                  All webinars, resources, and support materials are provided at no cost.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <Link 
                href="/faq"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 1.5rem',
                  background: '#29B8E8',
                  color: '#fff',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontSize: '0.9375rem',
                  boxShadow: '0 8px 32px rgba(41, 184, 232, 0.35)',
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
              >
                View All FAQs →
              </Link>
            </div>
          </div>

          {/* CTA Section */}
          <div style={{
            background: 'linear-gradient(135deg, #29B8E8 0%, #1A9DCA 100%)',
            padding: '3rem 2rem',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#fff'
          }}>
            <h2 style={{
              fontFamily: 'var(--font-montserrat)',
              fontSize: '1.75rem',
              fontWeight: 800,
              marginBottom: '1rem'
            }}>
              Ready to Get Started?
            </h2>
            <p style={{
              fontSize: '1.125rem',
              marginBottom: '2rem',
              opacity: 0.95
            }}>
              Join thousands of Australian schools prioritizing student wellbeing
            </p>
            <Link 
              href="/register"
              style={{
                display: 'inline-block',
                padding: '1rem 2rem',
                background: '#fff',
                color: '#29B8E8',
                borderRadius: '9999px',
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: '1rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                transition: 'transform 0.15s'
              }}
            >
              📅 Register Your School Now
            </Link>
          </div>
      </main>
    </>
  );
}
