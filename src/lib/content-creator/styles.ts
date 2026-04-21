/* ═══════════════════════════════════════════════════════════════════════════
 * Writing Styles — shared types, Zod schemas, and client wrappers.
 *
 * A "style" is a reusable prompt fragment ("You write in a story-telling
 * voice…") that gets prepended to the system message of the content-creator
 * edge functions. Admins manage them on /admin/content-creator/styles and
 * pick one per brief. No new edge function: styles are just config.
 *
 * Co-located in one file for the same reasons `topics.ts` is: the surface
 * area is small and every importing module needs types + schemas + client.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { z } from 'zod';
import { adminFetch } from '@/lib/adminFetch';

/* ─── Types ──────────────────────────────────────────────────────────────── */

/** Mirrors the content_writing_styles row 1:1. */
export interface WritingStyle {
  id:          string;
  title:       string;
  description: string | null;
  prompt:      string;
  is_active:   boolean;
  sort_order:  number;
  created_by:  string | null;
  created_at:  string;
  updated_at:  string;
}

/* ─── Zod schemas ────────────────────────────────────────────────────────── */

const nonEmpty = z.string().trim().min(1);

// Keep server-side bounds a touch tighter than the DB CHECK so the user sees
// a Zod message rather than a PG error.
const titleField       = nonEmpty.max(120);
const descriptionField = z.string().trim().max(400).nullable().optional();
const promptField      = nonEmpty.min(10, 'Prompt must be at least 10 characters').max(4000);
const sortOrderField   = z.number().int().min(0).max(10_000);

export const CreateStyleSchema = z.object({
  title:       titleField,
  description: descriptionField,
  prompt:      promptField,
  is_active:   z.boolean().optional(),
  sort_order:  sortOrderField.optional(),
}).strict();
export type CreateStyleInput = z.infer<typeof CreateStyleSchema>;

// All fields optional on PATCH so the admin can toggle just `is_active`
// without re-sending title/prompt.
export const PatchStyleSchema = z.object({
  title:       titleField.optional(),
  description: descriptionField,
  prompt:      promptField.optional(),
  is_active:   z.boolean().optional(),
  sort_order:  sortOrderField.optional(),
}).strict();
export type PatchStyleInput = z.infer<typeof PatchStyleSchema>;

/* ─── Client wrappers ───────────────────────────────────────────────────── */

const BASE = '/api/admin/content-creator/styles';

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface ListStylesFilters {
  /** When true, only return `is_active=true` rows. Default false (all). */
  active_only?: boolean;
}

export async function listStyles(filters: ListStylesFilters = {}): Promise<WritingStyle[]> {
  const qs = new URLSearchParams();
  if (filters.active_only) qs.set('active_only', 'true');
  const res = await adminFetch(`${BASE}?${qs.toString()}`);
  const { styles } = await asJson<{ styles: WritingStyle[] }>(res);
  return styles;
}

export async function getStyle(id: string): Promise<WritingStyle> {
  const res = await adminFetch(`${BASE}/${id}`);
  const { style } = await asJson<{ style: WritingStyle }>(res);
  return style;
}

export async function createStyle(input: CreateStyleInput): Promise<WritingStyle> {
  const res = await adminFetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const { style } = await asJson<{ style: WritingStyle }>(res);
  return style;
}

export async function patchStyle(id: string, patch: PatchStyleInput): Promise<WritingStyle> {
  const res = await adminFetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const { style } = await asJson<{ style: WritingStyle }>(res);
  return style;
}

export async function deleteStyle(id: string): Promise<void> {
  const res = await adminFetch(`${BASE}/${id}`, { method: 'DELETE' });
  await asJson<{ ok: boolean }>(res);
}
