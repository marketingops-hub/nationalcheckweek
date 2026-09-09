/**
 * NCIW MCP Connector endpoint
 *
 * Implements the MCP Streamable HTTP transport (spec 2024-11-05).
 * One URL, Bearer-token auth. Teammates add this URL in Claude → Settings →
 * Connectors (OAuth client id/secret, or legacy MCP_API_KEY Bearer).
 *
 * Tools exposed:
 *   search_vault / list_documents / get_document  — research vault
 *   list_states / get_state / list_areas / get_area / list_issues / get_issue
 *     — published state, region, and issue content (same as /states, /areas, /issues)
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import OpenAI from 'openai';
import { verifyAccessToken, MCP_BASE_URL } from '@/lib/mcp/oauth';
import { GEO_TOOLS, callGeoTool } from '@/lib/mcp/geo-tools';

// ─── Auth (OAuth 2.1 Bearer access token) ────────────────────────────────────

/**
 * Authorize a request. Primary path: an OAuth access-token JWT issued by our
 * /oauth/token endpoint (verified for signature, issuer and MCP audience).
 * Legacy fallback: a static MCP_API_KEY, honoured ONLY if that env is set
 * (Bearer header or key-in-URL) — left in for backwards compatibility.
 */
export async function checkAuth(req: NextRequest, urlKey?: string): Promise<boolean> {
  const auth = req.headers.get('authorization') ?? '';
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    if (await verifyAccessToken(token)) return true;

    const legacy = process.env.MCP_API_KEY;
    if (legacy && token === legacy) return true;
  }
  const legacy = process.env.MCP_API_KEY;
  if (legacy && urlKey && urlKey === legacy) return true;
  return false;
}

// ─── CORS (Claude.ai calls from the browser) ───────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, mcp-session-id, Accept',
};

/** 401 that tells Claude where to discover OAuth (RFC 9728 §5.1). */
function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: 'Unauthorized' },
    {
      status: 401,
      headers: {
        ...CORS,
        'WWW-Authenticate': `Bearer resource_metadata="${MCP_BASE_URL}/.well-known/oauth-protected-resource"`,
      },
    },
  );
}

// ─── MCP tool definitions ──────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'search_vault',
    description:
      'Search the NCIW vault for research, statistics, resources, or other stored content. ' +
      'Prefers semantic (embedding) search; if embeddings are unavailable it falls back to ' +
      'Postgres full-text over chunk bodies (not just titles). Pass document_id to search ' +
      'inside a large document (hundreds of chunks) instead of reading front matter.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural-language search query' },
        limit: {
          type: 'number',
          description: 'Max chunks to return (default 8, max 20)',
        },
        category: {
          type: 'string',
          description: 'Optional: restrict to a specific category',
        },
        document_id: {
          type: 'string',
          description: 'Optional: restrict search to a single vault document UUID',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_documents',
    description:
      'List documents in the NCIW vault with optional filters. Useful for browsing ' +
      'what is available, or when you need a full document list rather than a search.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Filter by category' },
        kind: {
          type: 'string',
          enum: ['pdf', 'docx', 'txt', 'url', 'paste'],
          description: 'Filter by document type',
        },
        search: {
          type: 'string',
          description: 'Keyword search on document title',
        },
        limit: {
          type: 'number',
          description: 'Max documents to return (default 20, max 100)',
        },
      },
    },
  },
  {
    name: 'get_document',
    description:
      'Retrieve a specific vault document by ID, including citation metadata and a ' +
      'page of chunks. Default is the first 10 chunks (front matter on large PDFs). ' +
      'Use offset to page through later chunks, or search to filter chunks by keyword ' +
      'inside this document. Prefer search_vault with document_id for targeted findings.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Document UUID' },
        offset: {
          type: 'number',
          description: 'Chunk index to start from (default 0)',
        },
        limit: {
          type: 'number',
          description: 'Max chunks to return (default 10, max 30)',
        },
        search: {
          type: 'string',
          description: 'Optional keyword filter applied to chunk content',
        },
      },
      required: ['id'],
    },
  },
  ...GEO_TOOLS,
];

// ─── Tool implementations ──────────────────────────────────────────────────

type VaultDocMeta = {
  id: string;
  author: string | null;
  year: number | null;
  source_url: string | null;
  reference: string | null;
};

async function enrichDocs(
  db: ReturnType<typeof adminClient>,
  docIds: string[],
): Promise<Record<string, VaultDocMeta>> {
  if (docIds.length === 0) return {};
  const { data: docs } = await db
    .from('vault_documents')
    .select('id, author, year, source_url, reference')
    .in('id', docIds);
  return Object.fromEntries((docs ?? []).map((d) => [d.id, d]));
}

function embedFailureNote(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const status =
    err && typeof err === 'object' && 'status' in err
      ? Number((err as { status?: number }).status)
      : undefined;
  if (status === 429 || /insufficient_quota|quota|credits remaining/i.test(raw)) {
    return 'OpenAI embeddings quota/credits exhausted (429). Search used full-text over chunk bodies instead. Top up the OPENAI_API_KEY account to restore semantic search.';
  }
  return `Semantic search unavailable (${raw.slice(0, 180)}). Search used full-text over chunk bodies instead.`;
}

function queryTokens(query: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of query.toLowerCase().split(/[^a-z0-9]+/i)) {
    if (t.length >= 3 && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
    if (out.length >= 8) break;
  }
  return out;
}

async function keywordSearchVault(
  db: ReturnType<typeof adminClient>,
  opts: {
    query: string;
    k: number;
    category?: string;
    document_id?: string;
    reason?: string;
  },
): Promise<object> {
  const { query, k, category, document_id, reason } = opts;
  const tokens = queryTokens(query);

  let fts = db
    .from('vault_chunks')
    .select(
      'id, content, chunk_index, page, heading, document_id, vault_documents!inner(id, title, kind, status, author, year, source_url, reference)',
    )
    .eq('vault_documents.status', 'ready')
    .limit(Math.min(Math.max(k * 6, 24), 80));

  if (category) fts = fts.eq('vault_documents.category', category);
  if (document_id) fts = fts.eq('document_id', document_id);

  let rows: Record<string, unknown>[] | null = null;
  const ftsRes = await fts.textSearch('content', query, {
    type: 'websearch',
    config: 'english',
  });
  if (!ftsRes.error && ftsRes.data?.length) {
    rows = ftsRes.data as Record<string, unknown>[];
  } else if (tokens.length > 0) {
    let ilike = db
      .from('vault_chunks')
      .select(
        'id, content, chunk_index, page, heading, document_id, vault_documents!inner(id, title, kind, status, author, year, source_url, reference)',
      )
      .eq('vault_documents.status', 'ready')
      .or(tokens.map((t) => `content.ilike.%${t.replace(/[%_,]/g, '')}%`).join(','))
      .limit(document_id ? 200 : 80);
    if (category) ilike = ilike.eq('vault_documents.category', category);
    if (document_id) ilike = ilike.eq('document_id', document_id);
    const ilikeRes = await ilike;
    if (ilikeRes.error) throw new Error(ilikeRes.error.message);
    rows = (ilikeRes.data ?? []) as Record<string, unknown>[];
  }

  type DocJoin = {
    title?: string;
    kind?: string;
    author?: string | null;
    year?: number | null;
    source_url?: string | null;
    reference?: string | null;
  };

  const scored = (rows ?? []).map((row) => {
    const docRaw = row.vault_documents;
    const doc = (Array.isArray(docRaw) ? docRaw[0] : docRaw) as DocJoin | undefined;
    const hay = `${doc?.title ?? ''}\n${row.content ?? ''}`.toLowerCase();
    let score = 0;
    for (const t of tokens) {
      if (hay.includes(t)) score += 1;
      if ((doc?.title ?? '').toLowerCase().includes(t)) score += 2;
    }
    return {
      score,
      document_id: row.document_id as string,
      title: doc?.title ?? 'Untitled',
      kind: doc?.kind ?? '',
      author: doc?.author ?? null,
      year: doc?.year ?? null,
      source_url: doc?.source_url ?? null,
      reference: doc?.reference ?? null,
      page: (row.page as number | null) ?? null,
      heading: (row.heading as string | null) ?? null,
      chunk_index: (row.chunk_index as number | null) ?? null,
      content: row.content as string,
    };
  });

  const results = scored
    .filter((r) => tokens.length === 0 || r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  return {
    query,
    mode: 'keyword_fallback',
    note: reason ?? 'Full-text search over chunk bodies (embeddings not used).',
    results,
  };
}

async function toolSearchVault(args: {
  query: string;
  limit?: number;
  category?: string;
  document_id?: string;
}): Promise<object> {
  const { query, limit = 8, category, document_id } = args;
  const k = Math.min(limit, 20);
  const db = adminClient();

  // Document-scoped search skips embeddings: match_vault_chunks has no
  // document_id filter, and FTS already hits the body of a 400+ chunk PDF.
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && !document_id) {
    try {
      const openai = new OpenAI({ apiKey });
      const res = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
      });
      const embedding = res.data[0].embedding;

      const { data, error } = await db.rpc('match_vault_chunks', {
        query_embedding: embedding,
        match_k: k,
        min_similarity: 0.25,
        category_filter: category ?? null,
      });
      if (error) throw new Error(error.message);

      const rows = (data ?? []) as {
        chunk_id: string;
        document_id: string;
        document_title: string;
        document_kind: string;
        chunk_page?: number | null;
        chunk_heading?: string | null;
        content: string;
        similarity: number;
      }[];

      if (rows.length > 0) {
        const docMap = await enrichDocs(db, [...new Set(rows.map((r) => r.document_id))]);
        const results = rows.map((r) => {
          const meta = docMap[r.document_id] ?? {};
          return {
            score: Math.round(r.similarity * 1000) / 1000,
            document_id: r.document_id,
            title: r.document_title,
            kind: r.document_kind,
            author: meta.author ?? null,
            year: meta.year ?? null,
            source_url: meta.source_url ?? null,
            reference: meta.reference ?? null,
            page: r.chunk_page ?? null,
            heading: r.chunk_heading ?? null,
            content: r.content,
          };
        });
        return { query, mode: 'semantic', results };
      }
    } catch (err) {
      return keywordSearchVault(db, {
        query,
        k,
        category,
        reason: embedFailureNote(err),
      });
    }
  }

  return keywordSearchVault(db, {
    query,
    k,
    category,
    document_id,
    reason: document_id
      ? 'Full-text search inside the requested document.'
      : apiKey
        ? 'Semantic search returned no matches; used full-text over chunk bodies.'
        : 'Set OPENAI_API_KEY for semantic search. Used full-text over chunk bodies.',
  });
}

async function toolListDocuments(args: {
  category?: string;
  kind?: string;
  search?: string;
  limit?: number;
}): Promise<object> {
  const { category, kind, search, limit = 20 } = args;
  const db = adminClient();

  let q = db
    .from('vault_documents')
    .select(
      'id, title, kind, category, tags, author, year, status, chunk_count, created_at, source_url, reference',
    )
    .order('created_at', { ascending: false })
    .limit(Math.min(limit, 100));

  if (category) q = q.eq('category', category);
  if (kind) q = q.eq('kind', kind);
  if (search) q = q.ilike('title', `%${search}%`);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return { total: data?.length ?? 0, documents: data ?? [] };
}

async function toolGetDocument(args: {
  id: string;
  offset?: number;
  limit?: number;
  search?: string;
}): Promise<object> {
  const db = adminClient();
  const offset = Math.max(0, Math.floor(args.offset ?? 0));
  const limit = Math.min(Math.max(1, Math.floor(args.limit ?? 10)), 30);
  const search = args.search?.trim() || undefined;

  const { data: doc, error: docErr } = await db
    .from('vault_documents')
    .select(
      'id, title, kind, category, tags, author, publisher, year, source_url, reference, page_ref, status, chunk_count, char_count, token_count, page_count, created_at',
    )
    .eq('id', args.id)
    .single();
  if (docErr) throw new Error(docErr.message);

  let chunkQ = db
    .from('vault_chunks')
    .select('chunk_index, page, heading, content, token_count')
    .eq('document_id', args.id)
    .order('chunk_index')
    .range(offset, offset + limit - 1);

  if (search) {
    chunkQ = chunkQ.textSearch('content', search, {
      type: 'websearch',
      config: 'english',
    });
  }

  const { data: chunks, error: chunkErr } = await chunkQ;
  if (chunkErr) throw new Error(chunkErr.message);

  const returned = chunks?.length ?? 0;
  const total = (doc?.chunk_count as number | null) ?? 0;

  return {
    document: doc,
    chunk_preview: chunks ?? [],
    chunk_offset: offset,
    chunk_limit: limit,
    chunks_returned: returned,
    has_more: search ? returned === limit : offset + returned < total,
  };
}

// ─── MCP request dispatcher ────────────────────────────────────────────────

type JsonRpcRequest = {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};

type JsonRpcResponse = {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
};

async function dispatch(msg: JsonRpcRequest): Promise<JsonRpcResponse | null> {
  const { jsonrpc, id, method, params } = msg;

  // Notifications have no id — no response required
  if (id === undefined) return null;

  const respond = (result: unknown): JsonRpcResponse => ({
    jsonrpc,
    id: id ?? null,
    result,
  });
  const error = (code: number, message: string): JsonRpcResponse => ({
    jsonrpc,
    id: id ?? null,
    error: { code, message },
  });

  try {
    switch (method) {
      case 'initialize':
        return respond({
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'nciw-mcp', version: '1.1.0' },
        });

      case 'ping':
        return respond({});

      case 'tools/list':
        return respond({ tools: TOOLS });

      case 'tools/call': {
        const name = params?.name as string;
        const args = (params?.arguments ?? {}) as Record<string, unknown>;

        let result: object;
        if (name === 'search_vault') {
          result = await toolSearchVault(args as Parameters<typeof toolSearchVault>[0]);
        } else if (name === 'list_documents') {
          result = await toolListDocuments(args as Parameters<typeof toolListDocuments>[0]);
        } else if (name === 'get_document') {
          result = await toolGetDocument(args as Parameters<typeof toolGetDocument>[0]);
        } else {
          const geo = await callGeoTool(name, args);
          if (!geo) return error(-32602, `Unknown tool: ${name}`);
          result = geo;
        }

        return respond({
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        });
      }

      default:
        return error(-32601, `Method not found: ${method}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return error(-32603, msg);
  }
}

// ─── Shared route handlers (used by both /api/mcp and /api/mcp/[key]) ────────

export async function handlePOST(req: NextRequest, urlKey?: string) {
  if (!(await checkAuth(req, urlKey))) {
    return unauthorized();
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
      { status: 400, headers: CORS },
    );
  }

  if (Array.isArray(body)) {
    const responses = (
      await Promise.all((body as JsonRpcRequest[]).map(dispatch))
    ).filter(Boolean);
    return NextResponse.json(responses, { headers: CORS });
  }

  const response = await dispatch(body as JsonRpcRequest);
  if (response === null) {
    return new NextResponse(null, { status: 202, headers: CORS });
  }
  return NextResponse.json(response, { headers: CORS });
}

export async function handleGET(req: NextRequest, urlKey?: string) {
  if (!(await checkAuth(req, urlKey))) {
    return unauthorized();
  }
  return NextResponse.json(
    { name: 'nciw-mcp', version: '1.1.0', protocol: 'mcp/2024-11-05' },
    { headers: CORS },
  );
}

// ─── Route handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  return handlePOST(req);
}

export async function GET(req: NextRequest) {
  return handleGET(req);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
