/* ═══════════════════════════════════════════════════════════════════════════
 * Next.js Edge Middleware
 *
 * Two responsibilities:
 *
 * 1. AI-scraper interception (GEO — Generative Engine Optimization)
 *    Detects known AI crawler user-agents and rewrites their requests
 *    to /api/llms-md?path=<original-path>, serving clean Markdown instead
 *    of full HTML. This is the equivalent of the WordPress LLM Override
 *    plugin — lightweight, on-the-fly, no database changes needed.
 *
 *    Bots intercepted: GPTBot, ClaudeBot, PerplexityBot, Anthropic-AI,
 *    Googlebot (Extended crawl), CCBot, cohere-ai, Applebot-Extended,
 *    FacebookBot (for AI features), meta-externalagent, BingBot/AI.
 *
 * 2. Admin auth redirect
 *    /admin/* requires a Supabase session cookie. If absent, redirect
 *    to /admin/login.
 *
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';

/* ─── AI bot detection ───────────────────────────────────────────────────── */

// User-agent substrings for known AI crawlers
const AI_BOT_SIGNATURES = [
  'GPTBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'Anthropic-AI',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'cohere-ai',
  'CCBot',
  'Googlebot-Extended',
  'Google-Extended',
  'Applebot-Extended',
  'meta-externalagent',
  'FacebookBot',
  'Bytespider',    // ByteDance AI
  'Diffbot',
  'ImagesiftBot',
  'YouBot',
  'OAI-SearchBot',
];

// Paths that should NOT be rewritten to Markdown (serve HTML as normal)
const SKIP_PATHS = [
  '/api/',
  '/admin',
  '/_next/',
  '/favicon',
  '/icon',
  '/sitemap',
  '/robots',
  '/llms',
  '/opengraph',
];

function isAiBot(ua: string): boolean {
  const lower = ua.toLowerCase();
  return AI_BOT_SIGNATURES.some(sig => lower.includes(sig.toLowerCase()));
}

function shouldSkip(pathname: string): boolean {
  return SKIP_PATHS.some(p => pathname.startsWith(p)) ||
         pathname.includes('.') || // static assets
         pathname === '/';         // homepage — serve HTML (it's the brand landing page)
}

/* ─── Admin auth ─────────────────────────────────────────────────────────── */

function hasAdminSession(req: NextRequest): boolean {
  // Supabase sets sb-<project>-auth-token or uses a custom cookie
  const cookies = req.cookies;
  for (const [name] of Object.entries(cookies.getAll ? Object.fromEntries(cookies.getAll().map(c => [c.name, c.value])) : {})) {
    if (name.includes('auth-token') || name.includes('supabase')) return true;
  }
  return false;
}

/* ─── Middleware ─────────────────────────────────────────────────────────── */

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* 1. Admin auth — protect /admin/* */
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login') && !pathname.startsWith('/admin/pages/register')) {
    if (!hasAdminSession(req)) {
      const login = new URL('/admin/login', req.url);
      login.searchParams.set('redirect', pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  /* 2. AI-scraper interception — skip paths that shouldn't be rewritten */
  if (shouldSkip(pathname)) return NextResponse.next();

  // Don't rewrite if this is already an LLM-served response (avoid loops)
  if (req.headers.get('x-llm-source')) return NextResponse.next();

  const ua = req.headers.get('user-agent') ?? '';
  if (!isAiBot(ua)) return NextResponse.next();

  // Rewrite to the Markdown endpoint
  const mdUrl = new URL('/api/llms-md', req.url);
  mdUrl.searchParams.set('path', pathname + req.nextUrl.search);

  // Log the intercept in a response header (visible in Vercel logs)
  const resp = NextResponse.rewrite(mdUrl);
  resp.headers.set('X-LLM-Intercepted', '1');
  resp.headers.set('X-LLM-Bot', ua.slice(0, 100));
  return resp;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image  (image optimisation)
     * - favicon.ico, icon files
     */
    '/((?!_next/static|_next/image|favicon.ico|icon).*)',
  ],
};
