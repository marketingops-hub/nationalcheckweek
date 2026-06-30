/* ───────────────────────────────────────────────────────────────────────────
 * Self-test for the OAuth-protected MCP vault connector (fixed client_id/secret).
 *
 *   node scripts/mcp-selftest.mjs [baseUrl]
 *
 * Reads MCP_PUBLIC_BASE_URL, MCP_OAUTH_CLIENT_ID, MCP_OAUTH_CLIENT_SECRET and
 * MCP_OAUTH_JWT_SECRET from the environment (source .env first). It:
 *   1. checks both OAuth discovery documents
 *   2. checks the 401 + WWW-Authenticate challenge on /api/mcp
 *   3. rejects a bad client_secret at the token endpoint
 *   4. mints a stateless auth code (same JWT secret the server uses), exchanges
 *      it at /oauth/token with the real client_secret + PKCE, then calls
 *      /api/mcp with the returned access token: initialize → tools/list →
 *      tools/call(list_documents). Also exercises the refresh_token grant.
 *
 * Step 4 stands in for the browser login so the whole token path is validated
 * without typing a password.
 * ─────────────────────────────────────────────────────────────────────────── */

import { SignJWT } from 'jose';

const BASE = (process.argv[2] || process.env.MCP_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
const RESOURCE_BASE = (process.env.MCP_PUBLIC_BASE_URL || BASE).replace(/\/+$/, '');
const RESOURCE = `${RESOURCE_BASE}/api/mcp`;
const MCP_URL = `${BASE}/api/mcp`;
const CLIENT_ID = process.env.MCP_OAUTH_CLIENT_ID || '';
const CLIENT_SECRET = process.env.MCP_OAUTH_CLIENT_SECRET || '';
const secret = new TextEncoder().encode(process.env.MCP_OAUTH_JWT_SECRET || '');
const REDIRECT = 'http://localhost/callback';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? '✓' : '✗ FAIL'}  ${n}${extra ? `  — ${extra}` : ''}`); };
const b64url = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function mintCode(challenge) {
  return new SignJWT({ typ: 'mcp_code', redirect_uri: REDIRECT, cc: challenge, ccm: 'S256', scope: 'vault:read', resource: RESOURCE, email: 'selftest@local' })
    .setProtectedHeader({ alg: 'HS256' }).setIssuer(RESOURCE_BASE).setSubject('selftest-user')
    .setIssuedAt().setExpirationTime('5m').sign(secret);
}

async function tokenReq(params) {
  const res = await fetch(`${BASE}/oauth/token`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function rpc(token, id, method, params) {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

console.log(`\nTesting OAuth MCP connector at ${BASE}\n`);

/* 1. discovery */
try {
  const as = await (await fetch(`${BASE}/.well-known/oauth-authorization-server`)).json();
  ok('AS metadata: token_endpoint present', !!as.token_endpoint, as.token_endpoint);
  ok('AS metadata: client_secret auth advertised', (as.token_endpoint_auth_methods_supported || []).includes('client_secret_post'));
  ok('AS metadata: no DCR (registration_endpoint absent)', !as.registration_endpoint);
  const pr = await (await fetch(`${BASE}/.well-known/oauth-protected-resource`)).json();
  ok('Protected-resource: resource matches MCP url', pr.resource === RESOURCE, pr.resource);
} catch (e) { ok('discovery endpoints', false, String(e)); }

/* 2. 401 challenge */
try {
  const res = await fetch(MCP_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  ok('unauthenticated MCP call → 401', res.status === 401, `status ${res.status}`);
  ok('401 carries WWW-Authenticate resource_metadata', (res.headers.get('www-authenticate') || '').includes('resource_metadata'));
} catch (e) { ok('401 challenge', false, String(e)); }

/* 3. token endpoint rejects a bad client secret */
try {
  const challenge = b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('v'))));
  const r = await tokenReq({ grant_type: 'authorization_code', code: await mintCode(challenge), client_id: CLIENT_ID, client_secret: 'WRONG', redirect_uri: REDIRECT, code_verifier: 'v' });
  ok('token endpoint rejects bad client_secret', r.status === 401 && r.body.error === 'invalid_client', `${r.status} ${r.body.error}`);
} catch (e) { ok('bad client_secret rejection', false, String(e)); }

/* 4. full code → token → MCP, then refresh */
try {
  const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
  const challenge = b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
  const tok = await tokenReq({ grant_type: 'authorization_code', code: await mintCode(challenge), client_id: CLIENT_ID, client_secret: CLIENT_SECRET, redirect_uri: REDIRECT, code_verifier: verifier });
  ok('code→token exchange (PKCE + client_secret)', tok.status === 200 && !!tok.body.access_token, tok.body.error || `expires_in ${tok.body.expires_in}`);

  const access = tok.body.access_token;
  if (access) {
    const init = await rpc(access, 1, 'initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'selftest', version: '0' } });
    ok('initialize with access token', init.status === 200 && !!init.body.result, `status ${init.status}`);
    const tools = await rpc(access, 2, 'tools/list', {});
    const names = (tools.body?.result?.tools || []).map(t => t.name);
    ok('tools/list returns vault tools', names.length >= 1, names.join(', '));
    const call = await rpc(access, 3, 'tools/call', { name: 'list_documents', arguments: { limit: 3 } });
    const txt = call.body?.result?.content?.[0]?.text || '';
    ok('tools/call list_documents returns data', txt.includes('documents') || txt.includes('total'), txt.slice(0, 70).replace(/\n/g, ' '));
  }

  if (tok.body.refresh_token) {
    const refreshed = await tokenReq({ grant_type: 'refresh_token', refresh_token: tok.body.refresh_token, client_id: CLIENT_ID, client_secret: CLIENT_SECRET });
    ok('refresh_token grant issues a new access token', refreshed.status === 200 && !!refreshed.body.access_token, refreshed.body.error || 'ok');
  }
} catch (e) { ok('full token flow', false, String(e)); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
