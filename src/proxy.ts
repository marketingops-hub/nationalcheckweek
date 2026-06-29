import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { canAccess, type Role } from '@/lib/rbac';

/** Edge-safe Supabase client with no-op cookies (for DB queries that don't need session) */
function makeStaticClient(url: string, key: string) {
  return createServerClient(url, key, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}

/* ─── AI bot interception (GEO — Generative Engine Optimization) ─────────── */

const AI_BOT_SIGNATURES = [
  'GPTBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web', 'Anthropic-AI', 'anthropic-ai',
  'PerplexityBot', 'Perplexity-User', 'cohere-ai', 'CCBot', 'Googlebot-Extended',
  'Google-Extended', 'Applebot-Extended', 'meta-externalagent', 'FacebookBot',
  'Bytespider', 'Diffbot', 'YouBot', 'OAI-SearchBot',
];

// Paths that should NOT be rewritten to Markdown — serve HTML as normal
const AI_SKIP_PREFIXES = ['/api/', '/admin', '/_next/', '/llms', '/sitemap', '/robots', '/favicon', '/icon', '/opengraph'];

function isAiBot(ua: string): boolean {
  const lower = ua.toLowerCase();
  return AI_BOT_SIGNATURES.some(s => lower.includes(s.toLowerCase()));
}

function shouldSkipAiRewrite(pathname: string): boolean {
  return AI_SKIP_PREFIXES.some(p => pathname.startsWith(p)) ||
         pathname.includes('.') || // static assets
         pathname === '/';         // homepage — brand landing, serve HTML
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Build new request headers that include x-pathname (readable by server layouts)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  /* ── AI bot interception — runs before redirect + auth checks ── */
  if (
    !shouldSkipAiRewrite(pathname) &&
    !request.headers.get('x-llm-source') &&
    isAiBot(request.headers.get('user-agent') ?? '')
  ) {
    const mdUrl = new URL('/api/llms-md', request.url);
    mdUrl.searchParams.set('path', pathname);
    const resp = NextResponse.rewrite(mdUrl);
    resp.headers.set('X-LLM-Intercepted', '1');
    return resp;
  }

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

    // Verify admin role — authenticated users must also be admin or super_admin.
    // If the service role key is missing we CANNOT verify the role, so we
    // must fail closed: a missing key previously skipped the role check
    // entirely and let any authenticated user into /admin.
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      loginUrl.searchParams.set('error', 'config_error');
      return NextResponse.redirect(loginUrl);
    }

    const serviceClient = makeStaticClient(supabaseUrl, serviceRoleKey);
    const { data: profile } = await serviceClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    // Normalise to tolerate dirty role data ("Editor", "admin ") set via SQL.
    const role = (profile?.role ?? '').toString().trim().toLowerCase() as Role;
    if (!role || !['editor', 'admin', 'super_admin'].includes(role)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      loginUrl.searchParams.set('error', 'access_denied');
      return NextResponse.redirect(loginUrl);
    }

    // Role-based path check
    if (!canAccess(role, pathname)) {
      const forbiddenUrl = request.nextUrl.clone();
      forbiddenUrl.pathname = '/admin';
      forbiddenUrl.searchParams.set('error', 'forbidden');
      return NextResponse.redirect(forbiddenUrl);
    }
  } catch {
    // Auth check failed (e.g. transient Supabase error). Fail CLOSED:
    // redirect to login rather than passing through. Failing open here
    // would grant unauthenticated access to /admin on any SDK/network
    // exception. A transient error logging an admin out is a far smaller
    // cost than an auth bypass.
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/|logo/|background/|.*\\.(?:jpg|jpeg|png|gif|svg|webp|ico|html)).*)',
  ],
};
