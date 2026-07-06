import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/**
 * Auth callback for password recovery / invite links.
 *
 * Two link formats are supported:
 *  - `?token_hash=…&type=recovery` — verified server-side via verifyOtp(). This
 *    needs NO PKCE code-verifier, so it works cross-device (admin-triggered
 *    reset/setup links opened on a different browser or machine). This is the
 *    format to prefer — point the Supabase email template at this route.
 *  - `?code=…` — the PKCE flow. Exchanged server-side using the verifier stored
 *    in the user's cookies, so it only works in the same browser that requested
 *    the reset. Kept as a fallback for the default email template.
 *
 * On success a session cookie is set and we redirect into the login page's
 * recovery mode so the user can choose a new password.
 */

const RECOVERY_DESTINATION = '/admin/login?recovery=1';

function safeNext(next: string | null): string {
  if (
    next &&
    next.startsWith('/admin') &&
    !next.includes('//') &&
    !next.includes('..')
  ) {
    return next;
  }
  return RECOVERY_DESTINATION;
}

function errorRedirect(message: string): never {
  redirect(`/admin/login?error=${encodeURIComponent(message)}`);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  // Surface link errors passed straight through from Supabase (e.g. expired).
  const linkError =
    searchParams.get('error_description') ?? searchParams.get('error');
  if (linkError && !tokenHash && !code) {
    errorRedirect(linkError);
  }

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) errorRedirect(error.message);
    redirect(next);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) errorRedirect(error.message);
    redirect(next);
  }

  errorRedirect('This reset link is invalid or has expired. Please request a new one.');
}
