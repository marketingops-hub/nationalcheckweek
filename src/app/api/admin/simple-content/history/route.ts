/* ═══════════════════════════════════════════════════════════════════════════
 * GET /api/admin/simple-content/history
 *
 * Returns the last 20 Quick Content generations for the history panel.
 * Response: { history: HistoryEntry[] }
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { adminClient } from '@/lib/adminClient';

export const runtime = 'nodejs';

export interface HistoryEntry {
  id:                 string;
  prompt:             string;
  title:              string;
  body:               string;
  feedback:           string | null;
  vault_ids:          string[];
  published_post_id:  string | null;
  created_at:         string;
  updated_at:         string;
}

export const GET = requireAdmin(async (_req: NextRequest) => {
  const sb = adminClient();
  const { data, error } = await sb
    .from('simple_content_history')
    .select('id, prompt, title, body, feedback, vault_ids, published_post_id, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[simple-content/history]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ history: (data ?? []) as HistoryEntry[] });
});
