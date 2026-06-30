/* RFC 9728 — Protected Resource Metadata. Catch-all so the bare path and the
 * resource-suffixed variant both resolve here. */

import { MCP_RESOURCE, MCP_ISSUER, MCP_SCOPE } from '@/lib/mcp/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': '*' };

export function GET() {
  return new Response(JSON.stringify({
    resource:                 MCP_RESOURCE,
    authorization_servers:    [MCP_ISSUER],
    scopes_supported:         [MCP_SCOPE],
    bearer_methods_supported: ['header'],
  }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS } });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
