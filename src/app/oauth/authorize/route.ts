/* OAuth 2.1 authorization endpoint — staff login, then a stateless PKCE code.
 *
 * GET  validates the request (fixed client_id + allowed redirect_uri + PKCE)
 *      and renders a Supabase login screen.
 * POST verifies the credentials + staff role and 302-redirects back with a
 *      signed authorization-code JWT (no DB). */

import { createClient } from '@supabase/supabase-js';
import {
  MCP_CLIENT_ID, MCP_SCOPE, ALLOWED_ROLES,
  isAllowedRedirectUri, issueAuthCode,
} from '@/lib/mcp/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface P {
  response_type: string; client_id: string; redirect_uri: string;
  code_challenge: string; code_challenge_method: string;
  scope: string; state: string; resource: string;
}

function read(sp: URLSearchParams): P {
  return {
    response_type:         sp.get('response_type')         ?? '',
    client_id:             sp.get('client_id')             ?? '',
    redirect_uri:          sp.get('redirect_uri')          ?? '',
    code_challenge:        sp.get('code_challenge')        ?? '',
    code_challenge_method: sp.get('code_challenge_method') ?? 'S256',
    scope:                 sp.get('scope')                 ?? MCP_SCOPE,
    state:                 sp.get('state')                 ?? '',
    resource:              sp.get('resource')              ?? '',
  };
}

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function html(body: string, status = 200): Response {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Vault Connector — Sign in</title><style>
*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f6f7f9;margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center;color:#1a1a2e}
.card{background:#fff;padding:32px;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.08);width:100%;max-width:380px}
h1{font-size:18px;margin:0 0 4px}p.sub{margin:0 0 22px;font-size:13px;color:#6b7280}
label{display:block;font-size:12px;font-weight:600;margin:14px 0 6px}
input{width:100%;padding:11px 13px;border:1px solid #d1d5db;border-radius:8px;font-size:14px}
button{width:100%;margin-top:20px;padding:12px;border:0;border-radius:8px;background:#3b82f6;color:#fff;font-weight:600;font-size:14px;cursor:pointer}
.err{background:#fef2f2;border:1px solid #fecaca;color:#dc2626;padding:10px 12px;border-radius:8px;font-size:13px;margin-bottom:16px}
.brand{display:flex;align-items:center;gap:8px;margin-bottom:18px;font-weight:700;font-size:15px}
</style></head><body>${body}</body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  );
}

const errorPage = (m: string) => html(`<div class="card"><div class="brand">🔒 Vault Connector</div>
  <div class="err">${esc(m)}</div><p class="sub">Close this window and try connecting again.</p></div>`, 400);

function loginForm(p: P, error?: string): Response {
  const hidden = (Object.entries(p) as [string, string][])
    .map(([k, v]) => `<input type="hidden" name="${k}" value="${esc(v)}">`).join('');
  return html(`<form class="card" method="post" action="/oauth/authorize">
    <div class="brand">🔒 Vault Connector</div>
    <h1>Sign in to connect</h1>
    <p class="sub">Use your National Check-in Week staff account. Claude will get read-only access to the Vault.</p>
    ${error ? `<div class="err">${esc(error)}</div>` : ''}
    <label>Email</label><input name="email" type="email" autocomplete="username" required autofocus>
    <label>Password</label><input name="password" type="password" autocomplete="current-password" required>
    ${hidden}
    <button type="submit">Sign in &amp; authorize</button>
  </form>`);
}

function validate(p: P): string | null {
  if (p.client_id !== MCP_CLIENT_ID)        return 'Unknown client_id.';
  if (!isAllowedRedirectUri(p.redirect_uri)) return 'Unregistered redirect URI.';
  return null;
}

function redirectBack(p: P, extra: Record<string, string>): Response {
  const u = new URL(p.redirect_uri);
  for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v);
  if (p.state) u.searchParams.set('state', p.state);
  return Response.redirect(u.toString(), 302);
}

export async function GET(req: Request) {
  const p = read(new URL(req.url).searchParams);
  const bad = validate(p);
  if (bad) return errorPage(bad);
  if (p.response_type !== 'code')           return redirectBack(p, { error: 'unsupported_response_type' });
  if (!p.code_challenge)                    return redirectBack(p, { error: 'invalid_request', error_description: 'PKCE required' });
  if (p.code_challenge_method !== 'S256')   return redirectBack(p, { error: 'invalid_request', error_description: 'only S256 supported' });
  return loginForm(p);
}

export async function POST(req: Request) {
  const form = await req.formData();
  const p = read(new URLSearchParams([...form.entries()].map(([k, v]) => [k, String(v)])));
  const email = String(form.get('email') ?? '');
  const password = String(form.get('password') ?? '');

  const bad = validate(p);
  if (bad) return errorPage(bad);

  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data: signIn, error: signErr } = await anon.auth.signInWithPassword({ email, password });
  if (signErr || !signIn.user) return loginForm(p, 'Invalid email or password.');

  const { adminClient } = await import('@/lib/adminClient');
  const { data: profile } = await adminClient()
    .from('user_profiles').select('role, email').eq('id', signIn.user.id).maybeSingle();

  const role = ((profile as { role?: string } | null)?.role ?? '').toString().trim().toLowerCase();
  if (!ALLOWED_ROLES.includes(role as (typeof ALLOWED_ROLES)[number])) {
    return loginForm(p, 'This account is not authorized to use the Vault connector.');
  }

  const code = await issueAuthCode({
    userId:                signIn.user.id,
    email:                 (profile as { email?: string } | null)?.email ?? signIn.user.email ?? undefined,
    redirect_uri:          p.redirect_uri,
    code_challenge:        p.code_challenge,
    code_challenge_method: p.code_challenge_method,
    scope:                 p.scope || MCP_SCOPE,
    resource:              p.resource,
  });

  return redirectBack(p, { code });
}
