'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Mode = 'login' | 'reset' | 'recovery';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(
    searchParams.get('error') === 'access_denied'
      ? 'Your account does not have admin access.'
      : ''
  );
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Handle the password-recovery link. The /admin/auth/callback route verifies
  // the link server-side, sets the session cookie, and redirects here with
  // `?recovery=1` — that's our cue to show the "set new password" form. We also
  // still support a raw PKCE `?code=` / recovery hash (same-browser fallback),
  // and surface any error the callback passes back. onAuthStateChange is a
  // backstop for the client-detected recovery event.
  useEffect(() => {
    const url = new URL(window.location.href);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const isRecoveryFlag = url.searchParams.get('recovery') === '1';
    const hasCode = url.searchParams.has('code');
    const isRecoveryHash = hash.get('type') === 'recovery';
    const errorParam = url.searchParams.get('error');
    const errorDesc =
      url.searchParams.get('error_description') ?? hash.get('error_description');

    if (errorDesc) {
      setError(errorDesc.replace(/\+/g, ' '));
    } else if (errorParam && errorParam !== 'access_denied') {
      // Full message passed by the callback route (already URL-decoded here).
      setError(errorParam);
    } else if (isRecoveryFlag || hasCode || isRecoveryHash) {
      setMode('recovery');
    }

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('recovery');
        setError('');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
    setResetSent(false);
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

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

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    // Supabase returns success regardless of whether the account exists, which
    // avoids leaking which emails are registered. Redirect back to login using
    // the current origin so the link works in any environment.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/admin/auth/callback` }
    );

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setResetSent(true);
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    // Password set — the recovery session is now a full session; go to admin.
    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="admin-shell min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-10">
          <Image
            src="/logo/nciw_no_background-1024x577.png"
            alt="National Check-in Week"
            width={1024}
            height={577}
            priority
            className="mx-auto mb-6 h-auto w-40"
          />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--admin-text-primary)', marginBottom: '6px' }}>
            {mode === 'login'
              ? 'Welcome back'
              : mode === 'recovery'
                ? 'Set a new password'
                : 'Reset your password'}
          </h1>
          <p style={{ color: 'var(--admin-text-subtle)', fontSize: '0.875rem' }}>
            {mode === 'login'
              ? 'Sign in to the SWA admin dashboard'
              : mode === 'recovery'
                ? 'Choose a new password for your account'
                : 'Enter your email and we’ll send you a reset link'}
          </p>
        </div>

        {/* Form card */}
        <div className="admin-card" style={{ padding: '32px' }}>
          {mode === 'recovery' ? (
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--admin-text-muted)' }}>New password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  required autoComplete="new-password" placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-[15px] outline-none transition-all"
                  style={{ background: '#fff', border: '1px solid var(--admin-border-strong)', color: 'var(--admin-text-primary)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--admin-text-muted)' }}>Confirm new password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  required autoComplete="new-password" placeholder="••••••••"
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
                    Updating…
                  </span>
                ) : 'Update password'}
              </button>
            </form>
          ) : mode === 'login' ? (
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold" style={{ color: 'var(--admin-text-muted)' }}>Password</label>
                  <button type="button" onClick={() => switchMode('reset')}
                    className="text-sm font-medium"
                    style={{ color: 'var(--admin-text-subtle)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Forgot password?
                  </button>
                </div>
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
          ) : resetSent ? (
            <div className="space-y-5">
              <div className="admin-alert admin-alert-success">
                If an account exists for <strong>{email}</strong>, you’ll receive an email with a link to reset your password shortly. Be sure to check your spam folder.
              </div>
              <button type="button" onClick={() => switchMode('login')}
                className="admin-btn admin-btn-primary w-full py-3 text-[15px]">
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--admin-text-muted)' }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required autoComplete="email" placeholder="you@example.com"
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
                    Sending…
                  </span>
                ) : 'Send reset link'}
              </button>

              <button type="button" onClick={() => switchMode('login')}
                className="w-full text-sm font-medium"
                style={{ color: 'var(--admin-text-subtle)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                ← Back to sign in
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-8 text-xs" style={{ color: 'var(--admin-text-faint)' }}>
          National Check-in Week · Admin Portal
        </p>
      </div>
    </div>
  );
}
