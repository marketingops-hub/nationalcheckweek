/* ═══════════════════════════════════════════════════════════════════════════
 * MCP connector OAuth 2.1 — fixed confidential client, stateless tokens.
 *
 * The connector is protected by a SINGLE pre-shared OAuth client: you paste
 * MCP_OAUTH_CLIENT_ID / MCP_OAUTH_CLIENT_SECRET into claude.ai's connector
 * "Advanced" fields. There is no Dynamic Client Registration and no database —
 * authorization codes, access tokens and refresh tokens are all stateless
 * signed JWTs, so this needs zero migrations.
 *
 * Endpoints that use this:
 *   /.well-known/oauth-protected-resource   (RFC 9728)
 *   /.well-known/oauth-authorization-server (RFC 8414)
 *   /oauth/authorize                        (staff login → auth code)
 *   /oauth/token                            (code/refresh → access token)
 *   /api/mcp                                (resource server; verifies token)
 *
 * Env:
 *   MCP_PUBLIC_BASE_URL      public origin Claude reaches us on (ngrok / prod)
 *   MCP_OAUTH_CLIENT_ID      the client id you paste into Claude
 *   MCP_OAUTH_CLIENT_SECRET  the client secret you paste into Claude
 *   MCP_OAUTH_JWT_SECRET     HS256 signing key for all JWTs
 *   MCP_OAUTH_REDIRECT_URIS  optional comma list; else claude.ai/.com allowed
 * ═══════════════════════════════════════════════════════════════════════════ */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export const MCP_BASE_URL  = (process.env.MCP_PUBLIC_BASE_URL ?? '').replace(/\/+$/, '');
export const MCP_ENDPOINT  = '/api/mcp';
export const MCP_RESOURCE  = `${MCP_BASE_URL}${MCP_ENDPOINT}`;
export const MCP_ISSUER    = MCP_BASE_URL;
export const MCP_SCOPE     = 'vault:read';

export const MCP_CLIENT_ID     = process.env.MCP_OAUTH_CLIENT_ID ?? '';
export const MCP_CLIENT_SECRET = process.env.MCP_OAUTH_CLIENT_SECRET ?? '';

const AUTH_CODE_TTL = 300;            // 5 min
const ACCESS_TTL    = 60 * 60;        // 1 hour
const REFRESH_TTL   = 60 * 60 * 24 * 30; // 30 days

export const ALLOWED_ROLES = ['editor', 'admin', 'super_admin'] as const;

export function assertConfigured(): void {
  const missing: string[] = [];
  if (!MCP_BASE_URL)                     missing.push('MCP_PUBLIC_BASE_URL');
  if (!process.env.MCP_OAUTH_JWT_SECRET) missing.push('MCP_OAUTH_JWT_SECRET');
  if (!MCP_CLIENT_ID)                    missing.push('MCP_OAUTH_CLIENT_ID');
  if (!MCP_CLIENT_SECRET)                missing.push('MCP_OAUTH_CLIENT_SECRET');
  if (missing.length) throw new Error(`[mcp-oauth] missing env: ${missing.join(', ')}`);
}

function secret(): Uint8Array {
  const s = process.env.MCP_OAUTH_JWT_SECRET;
  if (!s) throw new Error('[mcp-oauth] MCP_OAUTH_JWT_SECRET not set');
  return new TextEncoder().encode(s);
}

/* ─── Client + redirect-uri validation ───────────────────────────────────── */

/** Constant-time-ish secret comparison. */
export function verifyClient(clientId: string, clientSecret: string): boolean {
  if (clientId !== MCP_CLIENT_ID) return false;
  const a = new TextEncoder().encode(clientSecret);
  const b = new TextEncoder().encode(MCP_CLIENT_SECRET);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

const REDIRECT_ALLOWLIST = (process.env.MCP_OAUTH_REDIRECT_URIS ?? '')
  .split(',').map(s => s.trim()).filter(Boolean);

export function isAllowedRedirectUri(uri: string): boolean {
  try {
    const u = new URL(uri);
    if (REDIRECT_ALLOWLIST.length) return REDIRECT_ALLOWLIST.includes(uri);
    if (u.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) return true;
    if (u.protocol !== 'https:') return false;
    return u.hostname === 'claude.ai'  || u.hostname.endsWith('.claude.ai')
        || u.hostname === 'claude.com' || u.hostname.endsWith('.claude.com');
  } catch {
    return false;
  }
}

/* ─── Authorization codes (stateless JWT) ────────────────────────────────── */

export interface AuthCodeClaims {
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: string;
  scope: string;
  resource: string;
  email?: string;
}

export async function issueAuthCode(c: AuthCodeClaims & { userId: string }): Promise<string> {
  return new SignJWT({
    typ: 'mcp_code',
    redirect_uri: c.redirect_uri,
    cc: c.code_challenge,
    ccm: c.code_challenge_method,
    scope: c.scope,
    resource: c.resource,
    email: c.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(MCP_ISSUER).setSubject(c.userId)
    .setIssuedAt().setExpirationTime(`${AUTH_CODE_TTL}s`)
    .sign(secret());
}

export async function verifyAuthCode(token: string): Promise<(AuthCodeClaims & { sub: string }) | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: MCP_ISSUER });
    if (payload.typ !== 'mcp_code') return null;
    return {
      sub: String(payload.sub),
      redirect_uri: String(payload.redirect_uri),
      code_challenge: String(payload.cc),
      code_challenge_method: String(payload.ccm),
      scope: String(payload.scope),
      resource: String(payload.resource),
      email: payload.email ? String(payload.email) : undefined,
    };
  } catch {
    return null;
  }
}

/* ─── Access + refresh tokens ────────────────────────────────────────────── */

export async function issueAccessToken(o: { userId: string; email?: string; scope: string; resource: string }): Promise<string> {
  return new SignJWT({ typ: 'at+jwt', scope: o.scope, email: o.email })
    .setProtectedHeader({ alg: 'HS256', typ: 'at+jwt' })
    .setIssuer(MCP_ISSUER).setSubject(o.userId).setAudience(o.resource)
    .setIssuedAt().setExpirationTime(`${ACCESS_TTL}s`)
    .sign(secret());
}

export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: MCP_ISSUER, audience: MCP_RESOURCE });
    return payload;
  } catch {
    return null;
  }
}

export async function issueRefreshToken(o: { userId: string; email?: string; scope: string; resource: string }): Promise<string> {
  return new SignJWT({ typ: 'mcp_refresh', scope: o.scope, email: o.email, resource: o.resource })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(MCP_ISSUER).setSubject(o.userId)
    .setIssuedAt().setExpirationTime(`${REFRESH_TTL}s`)
    .sign(secret());
}

export async function verifyRefreshToken(token: string): Promise<{ sub: string; email?: string; scope: string; resource: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: MCP_ISSUER });
    if (payload.typ !== 'mcp_refresh') return null;
    return {
      sub: String(payload.sub),
      email: payload.email ? String(payload.email) : undefined,
      scope: String(payload.scope ?? MCP_SCOPE),
      resource: String(payload.resource ?? MCP_RESOURCE),
    };
  } catch {
    return null;
  }
}

export const TTL = { ACCESS_TTL, REFRESH_TTL, AUTH_CODE_TTL };

/* ─── PKCE (RFC 7636) ────────────────────────────────────────────────────── */

export async function verifyPkce(verifier: string, challenge: string, method: string): Promise<boolean> {
  if (!verifier || !challenge) return false;
  if (method === 'plain') return verifier === challenge;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const b64 = Buffer.from(new Uint8Array(digest)).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return b64 === challenge;
}
