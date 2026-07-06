import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { EmailOtpType } from '@supabase/supabase-js';

/**
 * Auth callback for password recovery / invite links.
 *
 * Two link formats are supported:
 *  - `?token_hash=…&type=recovery` — verified server-side via verifyOtp(). This
 *    needs NO PKCE code-verifier, so it works cross-device (admin-triggered
 *    reset/setup links opened on a different browser or machine). Prefer this —
 *    point the Supabase email template at this route.
 *  - `?code=…` — the PKCE flow. Exchanged server-side using the verifier stored
 *    in the user's cookies, so it only works in the same browser that requested
 *    the reset. Kept as a fallback for the default email template.
 *
 * The session cookies MUST be written onto the response we actually return, so
 * we bind the Supabase client to a NextResponse rather than the global cookie
 * store — otherwise the Set-Cookie is lost across the redirect and the user
 * lands on the recovery form with no session ("Auth session missing!").
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

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  // Collect any cookies the client wants to set, then attach them to whichever
  // redirect response we return.
  const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const redirectTo = (path: string) => {
    const res = NextResponse.redirect(new URL(path, origin));
    pendingCookies.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options),
    );
    return res;
  };
  const errorRedirect = (message: string) =>
    redirectTo(`/admin/login?error=${encodeURIComponent(message)}`);

  // Surface link errors passed straight through from Supabase (e.g. expired).
  const linkError =
    searchParams.get('error_description') ?? searchParams.get('error');
  if (linkError && !tokenHash && !code) {
    return errorRedirect(linkError);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return errorRedirect('Server is not configured for authentication.');
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        pendingCookies.push(...cookiesToSet);
      },
    },
  });

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) return errorRedirect(error.message);
    return redirectTo(next);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return errorRedirect(error.message);
    return redirectTo(next);
  }

  return errorRedirect('This reset link is invalid or has expired. Please request a new one.');
}
