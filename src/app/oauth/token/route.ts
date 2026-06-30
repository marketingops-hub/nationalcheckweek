/* OAuth 2.1 token endpoint — fixed confidential client, stateless grants.
 *
 *   authorization_code : verify client secret + PKCE + redirect_uri, then issue
 *                        an access-token JWT (aud = MCP resource) + refresh JWT.
 *   refresh_token      : verify client secret + refresh JWT → new access token.
 *
 * Client auth accepts client_secret_post (body) or client_secret_basic (header).
 */

import {
  MCP_RESOURCE, MCP_SCOPE, TTL,
  verifyClient, verifyAuthCode, verifyPkce,
  issueAccessToken, issueRefreshToken, verifyRefreshToken,
} from '@/lib/mcp/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };

function err(error: string, description?: string, status = 400): Response {
  return new Response(JSON.stringify({ error, error_description: description }),
    { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS } });
}
function ok(body: unknown): Response {
  return new Response(JSON.stringify(body),
    { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS } });
}

async function readBody(req: Request): Promise<URLSearchParams> {
  const ct = req.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    const j = await req.json().catch(() => ({}));
    return new URLSearchParams(Object.entries(j as Record<string, unknown>).map(([k, v]) => [k, String(v)]));
  }
  return new URLSearchParams(await req.text());
}

/** Resolve client credentials from body (post) or Authorization: Basic (basic). */
function clientCreds(req: Request, body: URLSearchParams): { id: string; secret: string } {
  const auth = req.headers.get('authorization') ?? '';
  if (auth.startsWith('Basic ')) {
    try {
      const [id, secret] = Buffer.from(auth.slice(6), 'base64').toString('utf8').split(':');
      return { id: decodeURIComponent(id ?? ''), secret: decodeURIComponent(secret ?? '') };
    } catch { /* fall through */ }
  }
  return { id: body.get('client_id') ?? '', secret: body.get('client_secret') ?? '' };
}

export async function POST(req: Request) {
  const body = await readBody(req);
  const grant = body.get('grant_type') ?? '';

  const { id, secret } = clientCreds(req, body);
  if (!verifyClient(id, secret)) return err('invalid_client', 'Bad client_id or client_secret.', 401);

  if (grant === 'authorization_code') {
    const code         = body.get('code') ?? '';
    const redirect_uri = body.get('redirect_uri') ?? '';
    const verifier     = body.get('code_verifier') ?? '';
    if (!code || !verifier) return err('invalid_request', 'code and code_verifier are required.');

    const claims = await verifyAuthCode(code);
    if (!claims) return err('invalid_grant', 'Authorization code invalid or expired.');
    if (claims.redirect_uri !== redirect_uri) return err('invalid_grant', 'redirect_uri mismatch.');
    if (!(await verifyPkce(verifier, claims.code_challenge, claims.code_challenge_method)))
      return err('invalid_grant', 'PKCE verification failed.');

    const scope    = claims.scope || MCP_SCOPE;
    const resource = claims.resource || MCP_RESOURCE;
    const access_token  = await issueAccessToken({ userId: claims.sub, email: claims.email, scope, resource });
    const refresh_token = await issueRefreshToken({ userId: claims.sub, email: claims.email, scope, resource });
    return ok({ access_token, refresh_token, token_type: 'Bearer', expires_in: TTL.ACCESS_TTL, scope });
  }

  if (grant === 'refresh_token') {
    const refresh = body.get('refresh_token') ?? '';
    if (!refresh) return err('invalid_request', 'refresh_token is required.');
    const r = await verifyRefreshToken(refresh);
    if (!r) return err('invalid_grant', 'Refresh token invalid or expired.');

    const access_token  = await issueAccessToken({ userId: r.sub, email: r.email, scope: r.scope, resource: r.resource });
    const refresh_token = await issueRefreshToken({ userId: r.sub, email: r.email, scope: r.scope, resource: r.resource });
    return ok({ access_token, refresh_token, token_type: 'Bearer', expires_in: TTL.ACCESS_TTL, scope: r.scope });
  }

  return err('unsupported_grant_type', `grant_type '${grant}' not supported.`);
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
