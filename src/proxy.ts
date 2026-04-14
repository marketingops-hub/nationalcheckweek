import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Edge-safe Supabase client with no-op cookies (for DB queries that don't need session) */
function makeStaticClient(url: string, key: string) {
  return createServerClient(url, key, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Build new request headers that include x-pathname (readable by server layouts)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // ── 1. DB-driven redirects (public routes only, no auth needed) ──
  if (
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/api') &&
    !pathname.includes('.')
  ) {
    if (supabaseUrl && supabaseKey) {
      try {
        const sb = makeStaticClient(supabaseUrl, supabaseKey);
        const { data: redirect } = await sb
          .from('redirects')
          .select('to_path, status_code')
          .eq('from_path', pathname)
          .eq('is_active', true)
          .maybeSingle();

        if (redirect) {
          const dest = redirect.to_path.startsWith('http')
            ? redirect.to_path
            : new URL(redirect.to_path, request.url).toString();
          return NextResponse.redirect(dest, { status: redirect.status_code });
        }
      } catch {
        // redirects table missing or DB unavailable — continue normally
      }
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── 2. Auth + role protection — only runs for /admin routes ──────

  // Always allow the login page through — no auth check, no redirect loop
  if (pathname === '/admin/login') {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // If Supabase env vars are missing, pass through
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
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
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify admin role — authenticated users must also be admin or super_admin
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
      const serviceClient = makeStaticClient(supabaseUrl, serviceRoleKey);
      const { data: profile } = await serviceClient
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/admin/login';
        loginUrl.searchParams.set('error', 'access_denied');
        return NextResponse.redirect(loginUrl);
      }
    }
  } catch {
    // Auth check failed — pass through, layout will handle it
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/|logo/|background/|.*\\.(?:jpg|jpeg|png|gif|svg|webp|ico)).*)',
  ],
};
