# Remote MCP Vault Connector — OAuth (fixed client id/secret)

An OAuth-protected MCP server served from this Next.js app. Claude (claude.ai /
Desktop) adds it via *Settings › Connectors → Add custom connector*, you paste a
**client id + client secret** into the Advanced fields, and staff sign in with
their Supabase account to get **read-only** Vault access.

- **Connector URL:** `https://<base>/api/mcp`
- **OAuth:** `/oauth/authorize`, `/oauth/token` (no Dynamic Client Registration)
- **Discovery:** `/.well-known/oauth-authorization-server`, `/.well-known/oauth-protected-resource`
- **Tools:** `search_vault`, `list_documents`, `get_document`

**No database migration required** — the OAuth client is a single pre-shared
credential (env), and authorization codes / access tokens / refresh tokens are
all stateless signed JWTs.

## Env (`.env`)

```
MCP_PUBLIC_BASE_URL=https://<your-ngrok-subdomain>.ngrok-free.app
MCP_OAUTH_CLIENT_ID=<client id you paste into Claude>
MCP_OAUTH_CLIENT_SECRET=<client secret you paste into Claude>
MCP_OAUTH_JWT_SECRET=<long random string — signs all JWTs>
# optional: exact redirect-uri allowlist (comma list). If unset, https
# callbacks on claude.ai / claude.com (and http://localhost) are allowed.
# MCP_OAUTH_REDIRECT_URIS=https://claude.ai/api/mcp/auth_callback
```

> ngrok free URLs change on restart — update `MCP_PUBLIC_BASE_URL` and restart
> `npm run dev` each time (tokens are bound to that origin as their audience).

## Run locally

```bash
# Node 18+ (Next 16). Then:
npm run dev          # http://localhost:3000
ngrok http 3000      # https://XXXX.ngrok-free.app  → set as MCP_PUBLIC_BASE_URL, restart dev
```

## Self-test before Claude

```bash
set -a; . ./.env; set +a
node scripts/mcp-selftest.mjs "$MCP_PUBLIC_BASE_URL"
```
Checks discovery, the 401 challenge, bad-secret rejection, and the full
code→token→MCP call + refresh (it mints a stateless code to stand in for the
browser login).

## Add to Claude

1. claude.ai → **Settings › Connectors → Add custom connector**
2. **URL:** `https://<base>/api/mcp`
3. Expand **Advanced** and paste:
   - **OAuth Client ID** = `MCP_OAUTH_CLIENT_ID`
   - **OAuth Client Secret** = `MCP_OAUTH_CLIENT_SECRET`
4. Claude discovers the OAuth server and opens `/oauth/authorize` in a browser
   tab (ngrok shows its "Visit Site" warning first) → staff login screen
5. Sign in with an editor/admin/super_admin account → connected
6. Try: *"Search the vault for teen anxiety statistics and cite sources."*

## Notes
- Access tokens are short-lived (1h) JWTs bound to the MCP resource URL (`aud`);
  refresh tokens last 30 days. Both are stateless — there is no server-side
  revocation list, so rotating `MCP_OAUTH_JWT_SECRET` invalidates everything.
- Authorization codes are stateless + short-lived (5 min) + PKCE-bound. Without
  a DB we don't enforce single-use; the short TTL + PKCE + client secret keep
  the replay window small. If you later want strict one-time codes or token
  revocation, reintroduce a small `oauth_codes` table.
- A legacy `MCP_API_KEY` Bearer/URL key still works **only if that env is set**;
  it's retired in favour of OAuth.
- Production: deploy to Vercel, set the same env vars (use your real domain as
  `MCP_PUBLIC_BASE_URL`), and add the connector with the same client id/secret.
