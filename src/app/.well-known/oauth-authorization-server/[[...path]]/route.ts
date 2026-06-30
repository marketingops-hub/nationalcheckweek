/* RFC 8414 — Authorization Server Metadata. Advertises a fixed confidential
 * client (client_secret auth, no Dynamic Client Registration) + PKCE S256. */

import { MCP_ISSUER, MCP_BASE_URL, MCP_SCOPE } from '@/lib/mcp/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': '*' };

export function GET() {
  return new Response(JSON.stringify({
    issuer:                                MCP_ISSUER,
    authorization_endpoint:                `${MCP_BASE_URL}/oauth/authorize`,
    token_endpoint:                        `${MCP_BASE_URL}/oauth/token`,
    response_types_supported:              ['code'],
    grant_types_supported:                 ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported:      ['S256'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    scopes_supported:                      [MCP_SCOPE],
    // No registration_endpoint: the client is pre-shared (paste id/secret in Claude).
  }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS } });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
