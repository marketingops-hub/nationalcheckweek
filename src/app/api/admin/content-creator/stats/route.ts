/* ═══════════════════════════════════════════════════════════════════════════
 * GET /api/admin/content-creator/stats
 *
 * Exact per-status counts for the pipeline overview page. Uses PostgREST's
 * `{ count: 'exact', head: true }` so we fetch zero rows but get the full
 * count — much cheaper than the previous "list 100 rows and take .length"
 * approach, and correct past 100.
 *
 * Response shape:
 *   { counts: { idea: N, approved_idea: N, ..., archived: N } }
 *
 * Counts are independent per status: the sum does not necessarily equal
 * total_rows because `archived` is a terminal and rows never leave it.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import type { ContentStatus } from '@/lib/content-creator/types';

export const runtime = 'nodejs';

/** Every status we track. Keep in sync with the DB CHECK constraint. */
const ALL_STATUSES: ContentStatus[] = [
  'idea', 'approved_idea', 'generating',
  'draft', 'verifying', 'verified', 'rejected',
  'archived',
];

export const GET = requireAdmin(async () => {
  const sb = adminClient();

  // Run all 8 count queries in parallel. Each is a HEAD request returning
  // only the `content-range` header, so total payload is tiny.
  const results = await Promise.all(
    ALL_STATUSES.map(async (status) => {
      const { count, error } = await sb
        .from('content_drafts')
        .select('id', { count: 'exact', head: true })
        .eq('status', status);
      if (error) throw new Error(`count(${status}) failed: ${error.message}`);
      return [status, count ?? 0] as const;
    }),
  ).catch((err: Error) => err);

  if (results instanceof Error) {
    return NextResponse.json({ error: results.message }, { status: 500 });
  }

  const counts = Object.fromEntries(results) as Record<ContentStatus, number>;
  return NextResponse.json({ counts });
});
