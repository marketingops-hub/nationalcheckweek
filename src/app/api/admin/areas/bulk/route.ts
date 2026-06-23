import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'edge';

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * POST /api/admin/areas/bulk
 * Insert multiple areas at once. Returns per-row results.
 * Body: { rows: Array<{ name, state, state_slug, type?, slug?, population?, schools? }> }
 */
export const POST = requireAdmin(async (req: NextRequest) => {
  const { rows } = await req.json() as {
    rows: Array<{
      name: string;
      state: string;
      state_slug: string;
      type?: string;
      slug?: string;
      population?: string;
      schools?: string;
    }>;
  };

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'No rows provided' }, { status: 400 });
  }

  const sb = adminClient();

  const results: Array<{ name: string; ok: boolean; error?: string }> = [];

  for (const row of rows) {
    const name = (row.name ?? '').trim();
    const state = (row.state ?? '').trim();
    const state_slug = (row.state_slug ?? '').trim();

    if (!name || !state || !state_slug) {
      results.push({ name: name || '(empty)', ok: false, error: 'name, state, and state_slug are required' });
      continue;
    }

    const record = {
      name,
      state,
      state_slug,
      slug: row.slug?.trim() || slugify(name),
      type: (['city', 'region', 'lga'].includes(row.type ?? '') ? row.type : 'city') as string,
      population: row.population?.trim() ?? '',
      schools: row.schools?.trim() ?? '',
      overview: '',
      prevention: '',
      key_stats: [],
      issues: [],
    };

    const { error } = await sb.from('areas').insert(record);
    if (error) {
      results.push({ name, ok: false, error: error.message });
    } else {
      results.push({ name, ok: true });
    }
  }

  const inserted = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;

  return NextResponse.json({ inserted, failed, results });
});
