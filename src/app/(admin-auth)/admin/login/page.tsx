'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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

    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D1117' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5" style={{ background: '#1C7ED6' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" />
              <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-1">Schools Wellbeing Admin</h1>
          <p className="text-sm" style={{ color: '#6E7681' }}>Sign in to access the dashboard</p>
        </div>

        <div className="rounded-xl p-8" style={{ background: '#161B22', border: '1px solid #30363D' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#C9D1D9' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3' }}
                onFocus={(e) => (e.target.style.borderColor = '#1C7ED6')}
                onBlur={(e) => (e.target.style.borderColor = '#30363D')}
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#C9D1D9' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3' }}
                onFocus={(e) => (e.target.style.borderColor = '#1C7ED6')}
                onBlur={(e) => (e.target.style.borderColor = '#30363D')}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#2D1317', border: '1px solid #6E1119', color: '#F85149' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-medium transition-opacity"
              style={{
                background: '#1C7ED6',
                color: '#fff',
                opacity: loading ? 0.65 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: '#484F58' }}>
          Schools Wellbeing Australia · Admin Portal
        </p>
      </div>
    </div>
  );
}
