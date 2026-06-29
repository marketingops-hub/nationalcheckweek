/**
 * NCIW Vault — MCP Connector endpoint
 *
 * Implements the MCP Streamable HTTP transport (spec 2024-11-05).
 * One URL, Bearer-token auth. Teammates add this URL in Claude → Settings →
 * Connectors and paste the MCP_API_KEY value as the Bearer token.
 *
 * Tools exposed:
 *   search_vault    — semantic search via pgvector (OpenAI embeddings)
 *   list_documents  — browse the vault with optional filters
 *   get_document    — fetch a document + chunk preview by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import OpenAI from 'openai';

// ─── Auth ──────────────────────────────────────────────────────────────────

export function checkAuth(req: NextRequest, urlKey?: string): boolean {
  const expected = process.env.MCP_API_KEY;
  if (!expected) return true; // no key set → open (dev only)
  if (urlKey && urlKey === expected) return true;
  const auth = req.headers.get('authorization') ?? '';
  return auth === `Bearer ${expected}`;
}

// ─── CORS (Claude.ai calls from the browser) ───────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, mcp-session-id, Accept',
};

// ─── MCP tool definitions ──────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'search_vault',
    description:
      'Semantically search the NCIW vault. Returns the most relevant document chunks ' +
      'ranked by cosine similarity. Use this to find research, statistics, resources, ' +
      'or any content stored in the vault.',
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
      'Retrieve a specific vault document by ID, including full citation metadata ' +
      'and a preview of the first 10 chunks.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Document UUID' },
      },
      required: ['id'],
    },
  },
];

// ─── Tool implementations ──────────────────────────────────────────────────

async function toolSearchVault(args: {
  query: string;
  limit?: number;
  category?: string;
}): Promise<object> {
  const { query, limit = 8, category } = args;
  const k = Math.min(limit, 20);
  const db = adminClient();

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
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

    // Enrich with citation fields not returned by the RPC
    const docIds = [...new Set((data as { document_id: string }[]).map((r) => r.document_id))];
    const { data: docs } = await db
      .from('vault_documents')
      .select('id, author, year, source_url, reference, page_ref, publisher')
      .in('id', docIds);
    const docMap = Object.fromEntries((docs ?? []).map((d) => [d.id, d]));

    const results = (data as {
      chunk_id: string;
      document_id: string;
      document_title: string;
      document_source: string | null;
      document_kind: string;
      content: string;
      similarity: number;
    }[]).map((r) => {
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
        content: r.content,
      };
    });

    return { query, mode: 'semantic', results };
  }

  // Fallback: keyword search on title when no OpenAI key
  const { data, error } = await db
    .from('vault_documents')
    .select('id, title, kind, category, author, year, source_url, reference')
    .eq('status', 'ready')
    .ilike('title', `%${query}%`)
    .limit(k);
  if (error) throw new Error(error.message);

  return {
    query,
    mode: 'keyword_fallback',
    note: 'Set OPENAI_API_KEY for semantic search',
    results: data ?? [],
  };
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

async function toolGetDocument(args: { id: string }): Promise<object> {
  const db = adminClient();
  const [{ data: doc, error: docErr }, { data: chunks, error: chunkErr }] =
    await Promise.all([
      db
        .from('vault_documents')
        .select(
          'id, title, kind, category, tags, author, publisher, year, source_url, reference, page_ref, status, chunk_count, char_count, token_count, page_count, created_at',
        )
        .eq('id', args.id)
        .single(),
      db
        .from('vault_chunks')
        .select('chunk_index, content, token_count')
        .eq('document_id', args.id)
        .order('chunk_index')
        .limit(10),
    ]);

  if (docErr) throw new Error(docErr.message);
  if (chunkErr) throw new Error(chunkErr.message);

  return { document: doc, chunk_preview: chunks ?? [] };
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
          serverInfo: { name: 'nciw-vault', version: '1.0.0' },
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
          return error(-32602, `Unknown tool: ${name}`);
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
  if (!checkAuth(req, urlKey)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });
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
  if (!checkAuth(req, urlKey)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });
  }
  return NextResponse.json(
    { name: 'nciw-vault', version: '1.0.0', protocol: 'mcp/2024-11-05' },
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
