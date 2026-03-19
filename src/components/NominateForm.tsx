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
};

function Field({ label, required, children, hint }: { label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-mid)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-body)' }}>
        {label}{required && <span style={{ color: 'var(--accent)', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{hint}</span>}
    </div>
  );
}

export default function NominateForm({ categories }: { categories: Category[] }) {
  const [form, setForm] = useState({
    nominee_first_name: '', nominee_last_name: '', nominee_email: '',
    nominee_phone: '', nominee_organisation: '', nominee_role_title: '',
    nominee_state: '', category_id: '', reason: '', nominee_linkedin: '',
    nominator_name: '', nominator_email: '', nominator_phone: '', nominator_relation: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); setError(''); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/ambassador/nominate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Submission failed');
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
        <div style={{ fontSize: '4rem', marginBottom: 20 }}>⭐</div>
        <h2 style={{ fontFamily: 'var(--font-body)', fontSize: '1.8rem', fontWeight: 900, color: 'var(--dark)', marginBottom: 16 }}>
          Nomination Submitted!
        </h2>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-mid)', lineHeight: 1.8, maxWidth: 480, margin: '0 auto 32px' }}>
          Thank you for nominating <strong>{form.nominee_first_name} {form.nominee_last_name}</strong>! 
          Our team will review the nomination and be in touch with you at <strong>{form.nominator_email}</strong>.
        </p>
        <a href="/" className="prevention-bridge__cta" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          ← Back to home
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Nominee Details */}
      <div>
        <div className="section-heading section-heading--tight">About the Person You're Nominating</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
          <Field label="First Name" required>
            <input style={IS} value={form.nominee_first_name} onChange={e => set('nominee_first_name', e.target.value)} placeholder="John" required />
          </Field>
          <Field label="Last Name" required>
            <input style={IS} value={form.nominee_last_name} onChange={e => set('nominee_last_name', e.target.value)} placeholder="Doe" required />
          </Field>
          <Field label="Email Address" hint="Optional — if you know it">
            <input style={IS} type="email" value={form.nominee_email} onChange={e => set('nominee_email', e.target.value)} placeholder="john@example.com" />
          </Field>
          <Field label="Phone Number" hint="Optional">
            <input style={IS} type="tel" value={form.nominee_phone} onChange={e => set('nominee_phone', e.target.value)} placeholder="0400 000 000" />
          </Field>
          <Field label="Organisation / School">
            <input style={IS} value={form.nominee_organisation} onChange={e => set('nominee_organisation', e.target.value)} placeholder="e.g. Westfield High School" />
          </Field>
          <Field label="Job Title / Role">
            <input style={IS} value={form.nominee_role_title} onChange={e => set('nominee_role_title', e.target.value)} placeholder="e.g. School Psychologist" />
          </Field>
          <Field label="State">
            <select style={IS} value={form.nominee_state} onChange={e => set('nominee_state', e.target.value)}>
              <option value="">— Select state —</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Ambassador Category" hint="What type of ambassador are they?">
            <select style={IS} value={form.category_id} onChange={e => set('category_id', e.target.value)}>
              <option value="">— Select category —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="LinkedIn Profile" hint="Optional">
            <input style={IS} type="url" value={form.nominee_linkedin} onChange={e => set('nominee_linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." />
          </Field>
        </div>
      </div>

      {/* Reason */}
      <div>
        <div className="section-heading section-heading--tight">Why Are You Nominating Them?</div>
        <div style={{ marginTop: 20 }}>
          <Field label="Your Reason" required hint="Tell us why this person would make a great Ambassador (min. 100 characters)">
            <textarea
              style={{ ...IS, resize: 'vertical', lineHeight: 1.7 }}
              rows={5}
              value={form.reason}
              onChange={e => set('reason', e.target.value)}
              placeholder="Describe why this person should be a Schools Wellbeing Ambassador — their impact, passion, leadership..."
              required
              minLength={100}
            />
          </Field>
        </div>
      </div>

      {/* Nominator Details */}
      <div>
        <div className="section-heading section-heading--tight">Your Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
          <Field label="Your Full Name" required>
            <input style={IS} value={form.nominator_name} onChange={e => set('nominator_name', e.target.value)} placeholder="Your name" required />
          </Field>
          <Field label="Your Email" required>
            <input style={IS} type="email" value={form.nominator_email} onChange={e => set('nominator_email', e.target.value)} placeholder="you@example.com" required />
          </Field>
          <Field label="Your Phone" hint="Optional">
            <input style={IS} type="tel" value={form.nominator_phone} onChange={e => set('nominator_phone', e.target.value)} placeholder="0400 000 000" />
          </Field>
          <Field label="Your Relationship to Nominee" hint="e.g. colleague, friend, parent">
            <input style={IS} value={form.nominator_relation} onChange={e => set('nominator_relation', e.target.value)} placeholder="e.g. Colleague" />
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
          {submitting ? 'Submitting…' : 'Submit Nomination →'}
        </button>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>
          Fields marked <span style={{ color: 'var(--accent)' }}>*</span> are required
        </span>
      </div>
    </form>
  );
}
