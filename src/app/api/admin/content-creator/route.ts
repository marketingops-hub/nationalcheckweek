/* ═══════════════════════════════════════════════════════════════════════════
 * /api/admin/content-creator
 *
 * GET  → list drafts, filterable by status and content_type.
 * POST → kick off stage 1 (generate_ideas). Creates N rows with status='idea'.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { create as createLimiter } from '@/lib/rateLimit';
import { GenerateIdeasSchema } from '@/lib/content-creator/schemas';

export const runtime = 'nodejs';

// Shared rate-limit bucket for every expensive AI stage on this feature.
// Ideas + generate + verify all share the 30/hour budget because they all
// hit the edge function and cost real $$.
export const contentCreatorAILimiter = createLimiter('content-creator-ai', {
  limit: 30,
  windowSeconds: 60 * 60,
});

// Hard ceiling for edge-fn round trips. Supabase edge fns themselves cap
// at 150s; the Next route has maxDuration=300 on the AI paths; we give
// the outgoing fetch 270s so there's still a ~25s budget for the Next
// handler to finish serializing and return before Vercel guillotines
// the request. GEO + long-form drafts observed p95 ≈ 90-150s on the
// full OpenAI (+ length retry) → Anthropic chain.
const EDGE_FN_TIMEOUT_MS = 270_000;

/* ─── GET — list ─────────────────────────────────────────────────────────── */

export const GET = requireAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const status       = searchParams.get('status');
  const content_type = searchParams.get('content_type');
  const limit        = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200);

  const sb = adminClient();
  let q = sb
    .from('content_drafts')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (status)       q = q.eq('status', status);
  if (content_type) q = q.eq('content_type', content_type);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ drafts: data ?? [] });
});

/* ─── POST — generate ideas via edge function ─────────────────────────────── */

export const POST = requireAdmin(async (req: NextRequest) => {
  const limited = contentCreatorAILimiter.check(req);
  if (limited) return limited;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = GenerateIdeasSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const edgeRes = await callEdge('content-creator-ideas', { ...parsed.data });

  // One-shot topic lifecycle: if this brief was spawned from a topic, flip
  // that topic to 'used' as soon as ideas are successfully generated. The
  // first idea's id is stored as used_in_draft_id for provenance. Only do
  // this when the edge fn returned 200 — we don't want to retire a topic
  // because of a network hiccup.
  const topicId = parsed.data.brief.source_topic_id;
  if (topicId && edgeRes.status === 200) {
    const firstIdeaId =
      (edgeRes.body as { ideas?: Array<{ id?: string }> } | undefined)
        ?.ideas?.[0]?.id ?? null;

    const sb = adminClient();
    // Only flip if still a 'draft' or 'approved' topic — don't clobber a
    // topic that the admin manually archived during generation.
    await sb
      .from('content_topics')
      .update({
        status: 'used',
        used_in_draft_id: firstIdeaId,
        used_at: new Date().toISOString(),
      })
      .eq('id', topicId)
      .in('status', ['draft', 'approved']);
  }

  return NextResponse.json(edgeRes.body, { status: edgeRes.status });
});

/* ─── Shared edge-function proxy used by POST and the action routes ──────── */

/**
 * Forward a payload to one of the per-stage Supabase Edge Functions.
 *
 * Each pipeline stage now has its own function (content-creator-topics,
 * -ideas, -generate, -verify). The caller names the target so we stay
 * explicit; no more `stage` discriminator in the body.
 *
 * Handles three failure modes cleanly:
 *   • env vars missing             → 500 with specific message
 *   • fetch aborts past timeout    → 504 so the client can show a retry CTA
 *   • edge fn returns non-JSON     → 502 with a preview of the body
 */
export async function callEdge(
  fnName: 'content-creator-topics' | 'content-creator-ideas' | 'content-creator-generate' | 'content-creator-verify',
  payload: Record<string, unknown>,
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return { status: 500, body: { error: 'Supabase env vars missing.' } };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EDGE_FN_TIMEOUT_MS);

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const raw = await res.text();
    let data: unknown;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      return {
        status: 502,
        body: { error: 'Edge fn returned non-JSON.', preview: raw.slice(0, 300) },
      };
    }
    return { status: res.ok ? 200 : res.status, body: data };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return {
        status: 504,
        body: { error: `Edge function timed out after ${EDGE_FN_TIMEOUT_MS / 1000}s.` },
      };
    }
    return {
      status: 500,
      body: { error: err instanceof Error ? err.message : 'Edge fn fetch failed.' },
    };
  } finally {
    clearTimeout(timer);
  }
}
