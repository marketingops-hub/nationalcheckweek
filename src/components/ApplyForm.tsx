'use client';

import { useState } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

const STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

const IS: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.95rem',
  color: 'var(--dark)',
  background: '#fff',
  fontFamily: 'var(--font-body)',
  outline: 'none',
  transition: 'border-color 0.15s',
};

const IS_FOCUS: React.CSSProperties = { ...IS, borderColor: 'var(--primary)' };

function FocusInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return <input {...props} style={focused ? IS_FOCUS : IS} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />;
}

function FocusSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [focused, setFocused] = useState(false);
  return <select {...props} style={focused ? IS_FOCUS : IS} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />;
}

function FocusTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [focused, setFocused] = useState(false);
  return <textarea {...props} style={focused ? { ...IS_FOCUS, resize: 'vertical', lineHeight: 1.7 } : { ...IS, resize: 'vertical', lineHeight: 1.7 }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />;
}

function Field({ label, required, children, hint, htmlFor }: { label: string; required?: boolean; children: React.ReactNode; hint?: string; htmlFor?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={htmlFor} style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-mid)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-body)' }}>
        {label}{required && <span style={{ color: 'var(--accent)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{hint}</span>}
    </div>
  );
}

export default function ApplyForm({ categories }: { categories: Category[] }) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    organisation: '', role_title: '', state: '', category_id: '',
    why_ambassador: '', experience: '', linkedin_url: '', website_url: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); setError(''); setWarning(''); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError(''); setWarning('');
    try {
      const res = await fetch('/api/ambassador/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Submission failed');
      if (d.warning) setWarning(d.warning);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 24px' }}>
        <div style={{ fontSize: '4rem', marginBottom: 20 }}>🎉</div>
        <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '1.8rem', fontWeight: 900, color: 'var(--dark)', marginBottom: 16 }}>
          Application Received!
        </h2>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-mid)', lineHeight: 1.8, maxWidth: 480, margin: '0 auto 32px' }}>
          Thank you for applying, <strong>{form.first_name}</strong>! Our team will review your 
          application and be in touch with you at <strong>{form.email}</strong>.
        </p>
        {warning && (
          <div style={{ padding: '14px 18px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 'var(--radius-md)', color: '#92400E', fontSize: '0.9rem', fontFamily: 'var(--font-body)', maxWidth: 520, margin: '0 auto 24px', textAlign: 'left' }}>
            <strong>⚠️ Note:</strong> {warning}
          </div>
        )}
        <a href="/" className="prevention-bridge__cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          ← Back to home
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Personal Details */}
      <div>
        <div className="section-heading section-heading--tight">Personal Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
          <Field label="First Name" required htmlFor="first_name">
            <FocusInput id="first_name" value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Jane" required />
          </Field>
          <Field label="Last Name" required htmlFor="last_name">
            <FocusInput id="last_name" value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Smith" required />
          </Field>
          <Field label="Email Address" required htmlFor="email">
            <FocusInput id="email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@example.com" required />
          </Field>
          <Field label="Phone Number" htmlFor="phone">
            <FocusInput id="phone" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0400 000 000" />
          </Field>
        </div>
      </div>

      {/* Professional Background */}
      <div>
        <div className="section-heading section-heading--tight">Professional Background</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
          <Field label="Organisation / School" htmlFor="organisation">
            <FocusInput id="organisation" value={form.organisation} onChange={e => set('organisation', e.target.value)} placeholder="e.g. Sunrise Primary School" />
          </Field>
          <Field label="Job Title / Role" htmlFor="role_title">
            <FocusInput id="role_title" value={form.role_title} onChange={e => set('role_title', e.target.value)} placeholder="e.g. Deputy Principal" />
          </Field>
          <Field label="State" htmlFor="state">
            <FocusSelect id="state" value={form.state} onChange={e => set('state', e.target.value)}>
              <option value="">— Select state —</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </FocusSelect>
          </Field>
          <Field label="Ambassador Category" hint="What type of ambassador best describes you?" htmlFor="category_id">
            <FocusSelect id="category_id" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
              <option value="">— Select category —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </FocusSelect>
          </Field>
          <Field label="LinkedIn Profile" hint="Optional" htmlFor="linkedin_url">
            <FocusInput id="linkedin_url" type="url" value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." />
          </Field>
          <Field label="Website / Portfolio" hint="Optional" htmlFor="website_url">
            <FocusInput id="website_url" type="url" value={form.website_url} onChange={e => set('website_url', e.target.value)} placeholder="https://..." />
          </Field>
        </div>
      </div>

      {/* Motivation */}
      <div>
        <div className="section-heading section-heading--tight">Your Motivation</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
          <Field label="Why do you want to be an Ambassador?" required hint="Tell us about your passion for student wellbeing (min. 100 characters)" htmlFor="why_ambassador">
            <FocusTextarea
              id="why_ambassador"
              rows={5}
              value={form.why_ambassador}
              onChange={e => set('why_ambassador', e.target.value)}
              placeholder="Share your passion for student wellbeing and why you'd like to represent this cause..."
              required
              minLength={100}
            />
          </Field>
          <Field label="Relevant Experience" hint="Any experience with student wellbeing, mental health, education leadership, etc." htmlFor="experience">
            <FocusTextarea
              id="experience"
              rows={4}
              value={form.experience}
              onChange={e => set('experience', e.target.value)}
              placeholder="Describe any relevant experience, programs you've run, talks you've given, etc."
            />
          </Field>
        </div>
      </div>

      {error && (
        <div style={{ padding: '14px 18px', background: 'var(--red-bg)', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-md)', color: 'var(--red)', fontSize: '0.9rem', fontFamily: 'var(--font-body)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 48 }}>
        <button
          type="submit"
          disabled={submitting}
          className="prevention-bridge__cta"
          style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer', border: 'none', fontSize: '1rem', padding: '14px 32px' }}
        >
          {submitting ? 'Submitting…' : 'Submit Application →'}
        </button>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>
          Fields marked <span style={{ color: 'var(--accent)' }}>*</span> are required
        </span>
      </div>
    </form>
  );
}
