/* ═══════════════════════════════════════════════════════════════════════════
 * Client-side fetch response helper, shared by the content-creator client
 * wrappers (client.ts, styles.ts, topics.ts).
 *
 * Kept in its own module (not api-helpers.ts) because api-helpers imports
 * `next/server` and is server-only — this one is safe to import from the
 * browser admin components.
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Resolve a fetch Response to typed JSON, throwing the API's `{ error }`
 *  message (or `HTTP <status>`) on a non-2xx response. */
export async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
