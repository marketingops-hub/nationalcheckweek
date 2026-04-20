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

/** Stage 2: idea → draft. May take 30-60s. */
export async function generateDraft(id: string): Promise<ContentDraft> {
  const res = await adminFetch(`${BASE}/${id}/generate`, { method: 'POST' });
  const { draft } = await asJson<{ draft: ContentDraft }>(res);
  return draft;
}

/** Stage 3: draft → verified | rejected. May take 20-40s. */
export async function verifyDraft(
  id: string,
): Promise<{ draft: ContentDraft; verification: VerificationResult }> {
  const res = await adminFetch(`${BASE}/${id}/verify`, { method: 'POST' });
  return asJson<{ draft: ContentDraft; verification: VerificationResult }>(res);
}

export async function patchDraft(
  id: string,
  patch: { title?: string | null; body?: string },
): Promise<ContentDraft> {
  const res = await adminFetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const { draft } = await asJson<{ draft: ContentDraft }>(res);
  return draft;
}

export async function archiveDraft(id: string): Promise<void> {
  const res = await adminFetch(`${BASE}/${id}`, { method: 'DELETE' });
  await asJson<{ ok: boolean }>(res);
}
