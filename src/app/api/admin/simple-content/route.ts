/* ═══════════════════════════════════════════════════════════════════════════
 * POST /api/admin/simple-content
 *
 * Thin proxy to the `simple-content` Supabase edge function.
 * Handles both actions: suggest_titles and generate.
 *
 * Body: { action: "suggest_titles" | "generate", prompt: string, title?: string }
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export const runtime     = 'nodejs';
export const maxDuration = 120;

const TIMEOUT_MS = 110_000;

async function proxyEdge(payload: Record<string, unknown>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return { status: 500, body: { error: 'Supabase env vars missing.' } };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/simple-content`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${serviceKey}`,
      },
      body:   JSON.stringify(payload),
      signal: controller.signal,
    });
    const raw = await res.text();
    let data: unknown;
    try { data = raw ? JSON.parse(raw) : {}; } catch {
      return { status: 502, body: { error: 'Edge fn returned non-JSON.', preview: raw.slice(0, 200) } };
    }
    if (res.ok && (typeof data !== 'object' || data === null || Array.isArray(data))) {
      return { status: 502, body: { error: 'Unexpected response shape from edge fn.' } };
    }
    return { status: res.ok ? 200 : res.status, body: data };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { status: 504, body: { error: `Edge fn timed out after ${TIMEOUT_MS / 1000}s.` } };
    }
    return { status: 500, body: { error: err instanceof Error ? err.message : 'Fetch failed.' } };
  } finally {
    clearTimeout(timer);
  }
}

export const POST = requireAdmin(async (req: NextRequest) => {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const result = await proxyEdge(body as Record<string, unknown>);
  return NextResponse.json(result.body, { status: result.status });
});
