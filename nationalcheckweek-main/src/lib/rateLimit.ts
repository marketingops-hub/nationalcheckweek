import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Each call to `create()` returns a limiter scoped to a specific action
 * (e.g. "vote", "apply"). The limiter tracks request counts per IP in a
 * Map that auto-evicts stale entries.
 *
 * ⚠️  In-memory — resets on deploy / cold start. For a multi-instance
 *    setup, replace the Map with a Redis / KV store.
 */

interface RateLimitConfig {
  /** Maximum requests allowed per window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

interface Entry {
  count: number;
  resetAt: number; // epoch ms
}

const stores = new Map<string, Map<string, Entry>>();

function getStore(name: string): Map<string, Entry> {
  let store = stores.get(name);
  if (!store) {
    store = new Map();
    stores.set(name, store);
  }
  return store;
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for') ?? '';
  return forwarded.split(',')[0].trim() || 'unknown';
}

/**
 * Create a rate limiter for a specific action.
 *
 * @example
 * ```ts
 * const limiter = rateLimit.create('vote', { limit: 10, windowSeconds: 60 });
 *
 * export async function POST(req: NextRequest) {
 *   const blocked = limiter.check(req);
 *   if (blocked) return blocked;
 *   // …handle request
 * }
 * ```
 */
export function create(name: string, config: RateLimitConfig) {
  const store = getStore(name);

  return {
    /**
     * Returns a 429 NextResponse if the client has exceeded the limit,
     * or `null` if the request is allowed.
     */
    check(req: NextRequest): NextResponse | null {
      const ip = getClientIp(req);
      const now = Date.now();

      // Evict stale entries periodically (every 100 checks)
      if (store.size > 1000) {
        for (const [key, entry] of store) {
          if (entry.resetAt <= now) store.delete(key);
        }
      }

      const existing = store.get(ip);

      if (!existing || existing.resetAt <= now) {
        // New window
        store.set(ip, { count: 1, resetAt: now + config.windowSeconds * 1000 });
        return null;
      }

      existing.count += 1;

      if (existing.count > config.limit) {
        const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfter),
              'X-RateLimit-Limit': String(config.limit),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(Math.ceil(existing.resetAt / 1000)),
            },
          }
        );
      }

      return null;
    },
  };
}
