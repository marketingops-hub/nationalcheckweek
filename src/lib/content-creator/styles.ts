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

/** One `examples` item. Short on-brand snippets shown to the model as
 *  few-shot anchors. `title` is optional but helpful for the admin UI. */
export interface StyleExample {
  title?:   string;
  snippet:  string;
}

/** Content types a style may apply to. 'all' is a wildcard. Keep lowercased. */
export type StyleAppliesTo = 'all' | 'blog' | 'newsletter' | 'social';

/** Mirrors the content_writing_styles row 1:1. */
export interface WritingStyle {
  id:          string;
  title:       string;
  description: string | null;
  prompt:      string;
  is_active:   boolean;
  sort_order:  number;
  applies_to:  StyleAppliesTo[];
  examples:    StyleExample[];
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

const AppliesToValue = z.enum(['all', 'blog', 'newsletter', 'social']);

// applies_to: at least one entry. If 'all' is present we normalise to
// just ['all'] server-side so the DB doesn't carry ambiguous data like
// ['all','blog']; enforced by the PG CHECK plus a transform here.
const appliesToField = z.array(AppliesToValue).min(1).max(4)
  .transform((arr) => (arr.includes('all') ? ['all'] as const : arr));

// examples: up to 3 snippets, each ≤ 500 chars. Mirrors (slightly tighter
// than) the 4 KB row-level cap so the user can't push a single snippet
// that fills the whole budget.
const StyleExampleSchema = z.object({
  title:   z.string().trim().max(80).optional(),
  snippet: nonEmpty.max(500),
}).strict();
const examplesField = z.array(StyleExampleSchema).max(3);

export const CreateStyleSchema = z.object({
  title:       titleField,
  description: descriptionField,
  prompt:      promptField,
  is_active:   z.boolean().optional(),
  sort_order:  sortOrderField.optional(),
  applies_to:  appliesToField.optional(),
  examples:    examplesField.optional(),
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
  applies_to:  appliesToField.optional(),
  examples:    examplesField.optional(),
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
  /** When set, only return styles whose `applies_to` contains this value
   *  or the 'all' wildcard. Powers the content-type-scoped brief dropdown. */
  applies_to?: Exclude<StyleAppliesTo, 'all'>;
}

export async function listStyles(filters: ListStylesFilters = {}): Promise<WritingStyle[]> {
  const qs = new URLSearchParams();
  if (filters.active_only) qs.set('active_only', 'true');
  if (filters.applies_to)  qs.set('applies_to', filters.applies_to);
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
