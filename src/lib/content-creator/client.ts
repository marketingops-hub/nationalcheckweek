/* ═══════════════════════════════════════════════════════════════════════════
 * Client-side wrappers over the Content Creator API routes.
 *
 * Keeps `adminFetch` quirks (auth headers, retries, JSON parsing) out of the
 * admin components. Every function returns a typed draft / list / verdict
 * and throws on network/API error — UI should catch and toast.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { adminFetch } from '@/lib/adminFetch';
import type {
  ContentDraft,
  ContentType,
  ContentStatus,
  ContentBrief,
  SocialPlatform,
  VerificationResult,
} from './types';

const BASE = '/api/admin/content-creator';

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface ListFilters {
  status?: ContentStatus | 'all';
  content_type?: ContentType;
  limit?: number;
}

export async function listDrafts(filters: ListFilters = {}): Promise<ContentDraft[]> {
  const qs = new URLSearchParams();
  if (filters.status && filters.status !== 'all') qs.set('status', filters.status);
  if (filters.content_type) qs.set('content_type', filters.content_type);
  if (filters.limit) qs.set('limit', String(filters.limit));

  const res = await adminFetch(`${BASE}?${qs.toString()}`);
  const { drafts } = await asJson<{ drafts: ContentDraft[] }>(res);
  return drafts;
}

export async function getDraft(id: string): Promise<ContentDraft> {
  const res = await adminFetch(`${BASE}/${id}`);
  const { draft } = await asJson<{ draft: ContentDraft }>(res);
  return draft;
}

/**
 * Exact per-status row counts via PostgREST HEAD counts. Used by the
 * pipeline overview page to display accurate KPI cards past 100 rows.
 */
export async function getStats(): Promise<Record<ContentStatus, number>> {
  const res = await adminFetch(`${BASE}/stats`);
  const { counts } = await asJson<{ counts: Record<ContentStatus, number> }>(res);
  return counts;
}

export interface CreateBriefInput {
  content_type: ContentType;
  platform?: SocialPlatform;
  brief: ContentBrief;
  count?: number;
}

/** Stage 1: generate ideas. Returns the inserted draft rows (status='idea'). */
export async function generateIdeas(input: CreateBriefInput): Promise<ContentDraft[]> {
  const res = await adminFetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const { ideas } = await asJson<{ ideas: ContentDraft[] }>(res);
  return ideas;
}

export async function approveIdea(id: string): Promise<ContentDraft> {
  const res = await adminFetch(`${BASE}/${id}/approve`, { method: 'POST' });
  const { draft } = await asJson<{ draft: ContentDraft }>(res);
  return draft;
}

/** Send an `approved_idea` row back to `idea` for more editing. */
export async function unapproveIdea(id: string): Promise<ContentDraft> {
  const res = await adminFetch(`${BASE}/${id}/unapprove`, { method: 'POST' });
  const { draft } = await asJson<{ draft: ContentDraft }>(res);
  return draft;
}

/**
 * Stage 2: idea → draft. May take 30-60s on OpenAI + Anthropic round-trip.
 * The Next.js route uses `maxDuration=90` and the edge fn proxy caps at 85s,
 * so we give the browser 100s before giving up. Otherwise the default
 * 30s adminFetch timeout aborts a request that's actually still working.
 */
export async function generateDraft(id: string): Promise<ContentDraft> {
  const res = await adminFetch(`${BASE}/${id}/generate`, {
    method:  'POST',
    timeout: 100_000,
  });
  const { draft } = await asJson<{ draft: ContentDraft }>(res);
  return draft;
}

/** Stage 3: draft → verified | rejected. Similar timeout profile to generate. */
export async function verifyDraft(
  id: string,
): Promise<{ draft: ContentDraft; verification: VerificationResult }> {
  const res = await adminFetch(`${BASE}/${id}/verify`, {
    method:  'POST',
    timeout: 100_000,
  });
  return asJson<{ draft: ContentDraft; verification: VerificationResult }>(res);
}

/**
 * PATCH a draft. Supports classic title/body edits plus the richer
 * draft-retargeting fields added in Apr 2026:
 *   - content_type / platform   (blog ↔ newsletter ↔ social)
 *   - brief_patch               (style_id, include_title, regeneration_feedback,
 *                                and any other brief field)
 *
 * The server shallow-merges brief_patch over the existing brief, so you
 * only need to send what changed.
 */
export async function patchDraft(
  id: string,
  patch: {
    title?:        string | null;
    body?:         string;
    content_type?: 'social' | 'blog' | 'newsletter';
    platform?:     'twitter' | 'linkedin' | 'facebook' | 'instagram' | null;
    brief_patch?:  Partial<{
      style_id:              string;
      include_title:         boolean;
      regeneration_feedback: string;
      topic:                 string;
      tone:                  string;
      audience:              string;
      keywords:              string[];
      vault_category:        string;
      length_preset:         'short' | 'standard' | 'long';
    }>;
  },
): Promise<ContentDraft> {
  const res = await adminFetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const { draft } = await asJson<{ draft: ContentDraft }>(res);
  return draft;
}

/**
 * Sign off on a verified draft. Runs after the AI verifier has passed
 * (status must be 'verified'); flips `verification.approved_at` +
 * `approved_by`. The row stays in status 'verified' — this is a flag
 * rather than a new pipeline stage.
 */
export async function finalizeDraft(id: string): Promise<ContentDraft> {
  const res = await adminFetch(`${BASE}/${id}/finalize`, { method: 'POST' });
  const { draft } = await asJson<{ draft: ContentDraft }>(res);
  return draft;
}

/**
 * Kick off a fresh generation pass with feedback from the admin. Accepted
 * when the draft is in draft / verified / rejected. Server merges the
 * feedback into brief.regeneration_feedback, flips status to 'generating',
 * and calls the generate edge fn with `regeneration: true`.
 */
export async function regenerateDraft(id: string, feedback: string): Promise<ContentDraft> {
  // Regenerate has the same profile as generate — OpenAI + Anthropic
  // round-trip can take 30–60s, so we give the browser 100s before
  // giving up. The default 30s adminFetch timeout aborts a request that
  // is actually still working on the server. (Matches `generateDraft`.)
  const res = await adminFetch(`${BASE}/${id}/regenerate`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ feedback }),
    timeout: 100_000,
  });
  const { draft } = await asJson<{ draft: ContentDraft }>(res);
  return draft;
}

/** Soft-delete — flips status to 'archived'. Reversible. */
export async function archiveDraft(id: string): Promise<void> {
  const res = await adminFetch(`${BASE}/${id}`, { method: 'DELETE' });
  await asJson<{ ok: boolean }>(res);
}

/**
 * Permanent row removal. Refused by the server if status is `generating`
 * or `verifying`. Use `archiveDraft` unless you really want the row gone.
 */
export async function deleteDraft(id: string): Promise<void> {
  const res = await adminFetch(`${BASE}/${id}?hard=true`, { method: 'DELETE' });
  await asJson<{ ok: boolean }>(res);
}
