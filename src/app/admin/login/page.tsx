'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(
    searchParams.get('error') === 'access_denied'
      ? 'Your account does not have admin access.'
      : ''
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const next = searchParams.get('next');
    // Strict validation: must start with /admin, not be login page, and not contain ../ or //
    const isValidNext = next 
      && next.startsWith('/admin') 
      && !next.startsWith('/admin/login')
      && !next.includes('../')
      && !next.includes('//')
      && next.split('/').every(segment => segment !== '..');
    const safePath = isValidNext ? next : '/admin';
    router.push(safePath);
    router.refresh();
  }

  return (
    <div className="admin-shell min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
            style={{ background: 'var(--admin-accent-gradient)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white"/>
              <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--admin-text-primary)', marginBottom: '6px' }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--admin-text-subtle)', fontSize: '0.875rem' }}>Sign in to the SWA admin dashboard</p>
        </div>

        {/* Form card */}
        <div className="admin-card" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--admin-text-muted)' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required autoComplete="email" placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl text-[15px] outline-none transition-all"
                style={{ background: '#fff', border: '1px solid var(--admin-border-strong)', color: 'var(--admin-text-primary)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--admin-text-muted)' }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required autoComplete="current-password" placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-[15px] outline-none transition-all"
                style={{ background: '#fff', border: '1px solid var(--admin-border-strong)', color: 'var(--admin-text-primary)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
              />
            </div>

            {error && (
              <div className="admin-alert admin-alert-error">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="admin-btn admin-btn-primary w-full py-3 text-[15px]"
              style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-xs" style={{ color: 'var(--admin-text-faint)' }}>
          National Check-in Week · Admin Portal
        </p>
      </div>
    </div>
  );
}
