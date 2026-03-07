import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Build new request headers that include x-pathname (readable by server layouts)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // ── 1. DB-driven redirects (public routes only, no auth needed) ──
  if (
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/api') &&
    !pathname.includes('.')
  ) {
    try {
      const sb = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: redirect } = await sb
        .from('redirects')
        .select('to_path, status_code')
        .eq('from_path', pathname)
        .eq('is_active', true)
        .single();

      if (redirect) {
        const dest = redirect.to_path.startsWith('http')
          ? redirect.to_path
          : new URL(redirect.to_path, request.url).toString();
        return NextResponse.redirect(dest, { status: redirect.status_code });
      }
    } catch {
      // redirects table missing or DB unavailable — continue normally
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── 2. Auth protection — only runs for /admin routes ─────────────

  // Always allow the login page through — no auth check, no redirect loop
  if (pathname === '/admin/login') {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // If Supabase env vars are missing, pass through
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    // Auth check failed — pass through, layout will handle it
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
