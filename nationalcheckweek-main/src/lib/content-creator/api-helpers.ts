/* ═══════════════════════════════════════════════════════════════════════════
 * Shared helpers for content-creator admin API routes.
 *
 * Every /api/admin/content-creator/* route does the same four things:
 *   1. parse JSON body, 400 on malformed
 *   2. validate with a Zod schema, 400 with structured issues on failure
 *   3. await the dynamic-segment params from the Next.js context
 *   4. map a Postgres error code to a meaningful HTTP status
 *
 * Collecting them here deletes ~30 boilerplate lines from each route and
 * — more importantly — guarantees identical error shapes across the
 * whole surface. Frontend can rely on `{error, issues?}` everywhere.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextResponse } from 'next/server';
import type { ZodSchema, ZodIssue } from 'zod';

/* ─── Response sugar ─────────────────────────────────────────────────────── */

/** Standard success envelope. Thin wrapper around NextResponse.json so a
 *  whole route body reads as `return ok({draft})` instead of two lines. */
export function ok<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/** Standard error envelope. `issues` is the Zod issues array when the
 *  caller wants to surface field-level validation errors. */
export function err(
  message: string,
  status = 500,
  issues?: ZodIssue[],
): NextResponse {
  return NextResponse.json(
    issues ? { error: message, issues } : { error: message },
    { status },
  );
}

/* ─── Body parsing + validation ──────────────────────────────────────────── */

/**
 * Parse the request body as JSON. Returns either the parsed value or a
 * ready-to-return 400 NextResponse. Pattern:
 *
 *     const body = await parseJsonBody(req);
 *     if (body instanceof NextResponse) return body;
 *
 * The if-instanceof check is slightly awkward but keeps the route
 * strictly linear (no nested try/catch) which is the whole point.
 */
export async function parseJsonBody(req: Request): Promise<unknown | NextResponse> {
  try {
    return await req.json();
  } catch {
    return err('Invalid JSON body.', 400);
  }
}

/**
 * Zod-validate a body. Returns the parsed data or a 400 NextResponse
 * with `issues` populated so the UI can render per-field errors.
 */
export function validate<T>(schema: ZodSchema<T>, body: unknown): T | NextResponse {
  const parsed = schema.safeParse(body);
  if (parsed.success) return parsed.data;
  return err('Validation failed', 400, parsed.error.issues);
}

/* ─── Dynamic params ─────────────────────────────────────────────────────── */

/**
 * Next 14+ wraps dynamic segments in a Promise. This helper makes the
 * unwrap explicit and typed so routes don't all need their own
 *
 *     type Ctx = { params: Promise<{ id: string }> };
 *
 * boilerplate. Use as:
 *     const { id } = await readParams<{ id: string }>(ctx);
 *
 * The `!` on `ctx!.params` matches the existing requireAdmin handler
 * signature which types `ctx` as optional even on dynamic routes.
 */
export async function readParams<P>(ctx: { params: Promise<P> } | undefined): Promise<P> {
  return ctx!.params;
}

/* ─── Postgres error → HTTP ──────────────────────────────────────────────── */

export interface PgErrorLike {
  code?:    string;
  message?: string;
}

/**
 * Map a Supabase/Postgres error into the right HTTP status + response.
 *
 * Codes handled:
 *   - PGRST116 → 404  (PostgREST: "single row requested but none found")
 *   - 23505    → 409  (unique_violation; surface as conflict so the UI
 *                      can show "name already taken"-style messages)
 *   - 23503    → 409  (foreign_key_violation; similar shape, distinct
 *                      reason — surfaced the same way for simplicity)
 *   - 23514    → 400  (check_violation; bad value, user fixable)
 *   - default  → 500
 *
 * Returns a NextResponse ready for `return pgError(error)`.
 */
export function pgError(e: PgErrorLike): NextResponse {
  const message = e.message ?? 'Database error';
  switch (e.code) {
    case 'PGRST116': return err(message, 404);
    case '23505':
    case '23503':    return err(message, 409);
    case '23514':    return err(message, 400);
    default:         return err(message, 500);
  }
}
