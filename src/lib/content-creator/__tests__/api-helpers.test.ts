/* ═══════════════════════════════════════════════════════════════════════════
 * Unit tests for the shared content-creator API helpers.
 *
 * All three routes in this family depend on these helpers returning the
 * exact same error envelopes (so the client's `apiFetch` can unwrap them
 * generically). These tests pin that contract.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  ok, err, pgError, parseJsonBody, validate, readParams,
} from '../api-helpers';
import { NextResponse } from 'next/server';

/* ─── ok / err ───────────────────────────────────────────────────────────── */

describe('ok()', () => {
  it('returns a NextResponse with status 200 by default', async () => {
    const r = ok({ hello: 'world' });
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ hello: 'world' });
  });

  it('respects a custom status', () => {
    expect(ok({ id: 1 }, 201).status).toBe(201);
  });
});

describe('err()', () => {
  it('returns {error} with the given status', async () => {
    const r = err('Bad thing', 400);
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: 'Bad thing' });
  });

  it('includes `issues` when provided (Zod field errors)', async () => {
    // Minimal stand-in for ZodIssue — the helper only forwards it verbatim.
    const issues = [{ code: 'custom', path: ['title'], message: 'required' }] as never;
    const r = err('Validation failed', 400, issues);
    const body = await r.json();
    expect(body.error).toBe('Validation failed');
    expect(body.issues).toEqual(issues);
  });

  it('defaults to status 500 when none supplied', () => {
    expect(err('boom').status).toBe(500);
  });
});

/* ─── pgError ────────────────────────────────────────────────────────────── */

describe('pgError()', () => {
  it('maps PGRST116 to 404', () => {
    expect(pgError({ code: 'PGRST116', message: 'no rows' }).status).toBe(404);
  });

  it('maps 23505 (unique_violation) to 409', () => {
    expect(pgError({ code: '23505', message: 'dup' }).status).toBe(409);
  });

  it('maps 23503 (foreign_key_violation) to 409', () => {
    expect(pgError({ code: '23503', message: 'fk' }).status).toBe(409);
  });

  it('maps 23514 (check_violation) to 400', () => {
    expect(pgError({ code: '23514', message: 'check' }).status).toBe(400);
  });

  it('falls back to 500 for unknown codes', () => {
    expect(pgError({ code: 'XXXXX', message: 'unknown' }).status).toBe(500);
    expect(pgError({ message: 'no code at all' }).status).toBe(500);
  });

  it('uses a generic message when none supplied', async () => {
    const r = pgError({ code: 'XXXXX' });
    expect(await r.json()).toEqual({ error: 'Database error' });
  });
});

/* ─── parseJsonBody ──────────────────────────────────────────────────────── */

describe('parseJsonBody()', () => {
  it('returns the parsed body on success', async () => {
    const req = new Request('http://x/', { method: 'POST', body: '{"a":1}' });
    const result = await parseJsonBody(req);
    expect(result).toEqual({ a: 1 });
  });

  it('returns a 400 NextResponse on invalid JSON', async () => {
    const req = new Request('http://x/', { method: 'POST', body: 'not-json' });
    const result = await parseJsonBody(req);
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(400);
  });
});

/* ─── validate ───────────────────────────────────────────────────────────── */

describe('validate()', () => {
  const schema = z.object({ title: z.string().min(3) });

  it('returns parsed data on success', () => {
    expect(validate(schema, { title: 'hello' })).toEqual({ title: 'hello' });
  });

  it('returns a 400 NextResponse with issues on failure', async () => {
    const result = validate(schema, { title: 'x' });
    expect(result).toBeInstanceOf(NextResponse);
    const body = await (result as NextResponse).json();
    expect(body.error).toBe('Validation failed');
    expect(Array.isArray(body.issues)).toBe(true);
    expect(body.issues.length).toBeGreaterThan(0);
  });
});

/* ─── readParams ─────────────────────────────────────────────────────────── */

describe('readParams()', () => {
  it('awaits and returns the params promise', async () => {
    const ctx = { params: Promise.resolve({ id: 'abc' }) };
    expect(await readParams(ctx)).toEqual({ id: 'abc' });
  });
});
