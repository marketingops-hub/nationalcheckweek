/* ═══════════════════════════════════════════════════════════════════════════
 * Unit tests for the request-scoped logger.
 *
 * The Deno edge fn can't be easily unit-tested — the Supabase Deno runtime
 * doesn't play nicely with Node's test runner. Because the logger helpers
 * are mirrored into src/ and enforced identical by the parity test, we can
 * exercise them here instead and trust the Deno side behaves the same.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger, newRequestId, LOG_PREFIX } from '../logger';

describe('newRequestId', () => {
  it('returns 10 hex characters', () => {
    const id = newRequestId();
    expect(id).toMatch(/^[0-9a-f]{10}$/);
  });

  it('produces distinct ids on repeat calls (collision-resistant enough for per-request)', () => {
    // 200 ids in a set — if even one collides across a short test run the
    // entropy source is broken.
    const ids = new Set<string>();
    for (let i = 0; i < 200; i++) ids.add(newRequestId());
    expect(ids.size).toBe(200);
  });
});

describe('createLogger — prefix structure', () => {
  let spies: { log: ReturnType<typeof vi.spyOn>; warn: ReturnType<typeof vi.spyOn>; error: ReturnType<typeof vi.spyOn> };

  beforeEach(() => {
    // Silence console; capture the calls.
    spies = {
      log:   vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn:  vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });
  afterEach(() => {
    spies.log.mockRestore();
    spies.warn.mockRestore();
    spies.error.mockRestore();
  });

  it('prepends [content-creator] [fn=…] [req=…] on info', () => {
    const log = createLogger('content-creator-generate', 'abc123');
    log.info('hello');
    expect(spies.log).toHaveBeenCalledWith(
      `${LOG_PREFIX} [fn=content-creator-generate] [req=abc123]`,
      'hello',
    );
  });

  it('uses console.warn for .warn and console.error for .error', () => {
    const log = createLogger('fn', 'req');
    log.warn('w');
    log.error('e');
    expect(spies.warn).toHaveBeenCalledTimes(1);
    expect(spies.error).toHaveBeenCalledTimes(1);
  });

  it('generates a fresh request id when one is not supplied', () => {
    const log = createLogger('fn');
    expect(log.requestId).toMatch(/^[0-9a-f]{10}$/);
  });

  it('honours the caller-supplied request id', () => {
    const log = createLogger('fn', 'fixed-id');
    expect(log.requestId).toBe('fixed-id');
  });

  it('passes through variadic arguments without swallowing them', () => {
    const log = createLogger('fn', 'req');
    log.info('a', 'b', 123, { x: 1 });
    const call = spies.log.mock.calls[0];
    // First arg is the header, then every passed arg in order.
    expect(call).toEqual([
      `${LOG_PREFIX} [fn=fn] [req=req]`,
      'a', 'b', 123, { x: 1 },
    ]);
  });
});

describe('createLogger — span helper', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => { logSpy.mockRestore(); });

  it('returns the elapsed milliseconds from .end()', () => {
    const log = createLogger('fn', 'r');
    const span = log.span('vault');
    const ms = span.end();
    // Non-negative integer. Lower bound of 0 accounts for fast runs;
    // upper bound guards against a pathological clock.
    expect(typeof ms).toBe('number');
    expect(ms).toBeGreaterThanOrEqual(0);
    expect(ms).toBeLessThan(5_000);
  });

  it('emits a structured `span=<label> ms=<n>` log line', () => {
    const log = createLogger('fn', 'r');
    log.span('openai.first').end();
    // Find the call that ends a span (not the initial info calls).
    const spanCall = logSpy.mock.calls.find(
      (args: unknown[]) => typeof args[0] === 'string' && (args[0] as string).includes('span=openai.first'),
    );
    expect(spanCall, 'expected a span end log line').toBeDefined();
    // Full format: `<prefix> span=<label> ms=<number>`
    expect(spanCall![0]).toMatch(
      /\[content-creator\] \[fn=fn\] \[req=r\] span=openai\.first ms=\d+/,
    );
  });
});
