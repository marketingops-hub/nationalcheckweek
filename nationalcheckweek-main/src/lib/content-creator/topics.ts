/* ═══════════════════════════════════════════════════════════════════════════
 * Content Topics — shared types, Zod schemas, and client wrappers.
 *
 * Co-located in one file because the surface area is small and every
 * importing module needs types + schemas + client together. If this grows
 * past ~300 lines, split into types.ts / schemas.ts / client.ts like the
 * main content-creator lib.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { z } from 'zod';
import { adminFetch } from '@/lib/adminFetch';
import type { AIMetadata } from './types';

/* ─── Types ──────────────────────────────────────────────────────────────── */

export type TopicStatus = 'draft' | 'approved' | 'used' | 'archived';

/** Mirrors content_topics row 1:1. */
export interface ContentTopic {
  id:                  string;
  title:               string;
  angle:               string;
  rationale:           string | null;
  suggested_keywords:  string[];
  suggested_audience:  string | null;
  suggested_tone:      string | null;
  source_document_ids: string[];
  vault_category:      string | null;
  status:              TopicStatus;
  used_in_draft_id:    string | null;
  used_at:             string | null;
  ai_metadata:         AIMetadata;
  created_by:          string;
  created_at:          string;
  updated_at:          string;
}

/** Terminal statuses — no polling needed once a topic lands here. */
export const TOPIC_STATUS_IS_TERMINAL: Record<TopicStatus, boolean> = {
  draft:    true,   // drafts are final until approved; no background work
  approved: true,
  used:     true,
  archived: true,
};

/* ─── Schemas ────────────────────────────────────────────────────────────── */

const nonEmpty = z.string().trim().min(1);

/** POST /api/admin/content-creator/topics/generate */
export const GenerateTopicsSchema = z.object({
  // Category is required (design decision: category-scoped generation).
  // Use 'all' sentinel when the admin wants cross-category topics.
  vault_category: nonEmpty.max(100),
  count:          z.number().int().min(1).max(10).default(5),
  seed:           z.string().trim().max(500).optional(),
});
export type GenerateTopicsInput = z.infer<typeof GenerateTopicsSchema>;

/** PATCH /api/admin/content-creator/topics/[id] — status changes + light edits. */
export const PatchTopicSchema = z.object({
  status:              z.enum(['approved', 'archived']).optional(),
  title:               nonEmpty.max(300).optional(),
  angle:               nonEmpty.max(2000).optional(),
  suggested_keywords:  z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  suggested_audience:  z.string().trim().max(200).optional().nullable(),
  suggested_tone:      z.string().trim().max(200).optional().nullable(),
}).strict();
export type PatchTopicInput = z.infer<typeof PatchTopicSchema>;

/* ─── Client wrappers ───────────────────────────────────────────────────── */

const BASE = '/api/admin/content-creator/topics';

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface ListTopicsFilters {
  status?:         TopicStatus | 'all';
  vault_category?: string | 'all';
  limit?:          number;
}

export async function listTopics(filters: ListTopicsFilters = {}): Promise<ContentTopic[]> {
  const qs = new URLSearchParams();
  if (filters.status         && filters.status         !== 'all') qs.set('status',         filters.status);
  if (filters.vault_category && filters.vault_category !== 'all') qs.set('vault_category', filters.vault_category);
  if (filters.limit)                                              qs.set('limit',          String(filters.limit));

  const res = await adminFetch(`${BASE}?${qs.toString()}`);
  const { topics } = await asJson<{ topics: ContentTopic[] }>(res);
  return topics;
}

export async function getTopic(id: string): Promise<ContentTopic> {
  const res = await adminFetch(`${BASE}/${id}`);
  const { topic } = await asJson<{ topic: ContentTopic }>(res);
  return topic;
}

export async function generateTopics(input: GenerateTopicsInput): Promise<ContentTopic[]> {
  const res = await adminFetch(`${BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const { topics } = await asJson<{ topics: ContentTopic[] }>(res);
  return topics;
}

export async function patchTopic(id: string, patch: PatchTopicInput): Promise<ContentTopic> {
  const res = await adminFetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const { topic } = await asJson<{ topic: ContentTopic }>(res);
  return topic;
}

export async function deleteTopic(id: string): Promise<void> {
  const res = await adminFetch(`${BASE}/${id}`, { method: 'DELETE' });
  await asJson<{ ok: boolean }>(res);
}

/** Convenience approve/archive shortcuts. */
export const approveTopic = (id: string) => patchTopic(id, { status: 'approved' });
export const archiveTopic = (id: string) => patchTopic(id, { status: 'archived' });
