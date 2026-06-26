import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireStaff } from '@/lib/auth';

export const runtime = 'edge';

export const GET = requireStaff(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') ?? 'applications';
  const status = searchParams.get('status') ?? '';

  const sb = adminClient();
  const table = type === 'nominations' ? 'ambassador_nominations' : 'ambassador_applications';

  const limit  = Math.min(Math.max(parseInt(searchParams.get('limit')  ?? '50', 10), 1), 200);
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0',  10), 0);

  let query = sb
    .from(table)
    .select('*, ambassador_categories(id, name, color, icon)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) {
    console.error('[submissions:list]', error.message);
    return NextResponse.json({ error: 'Failed to fetch submissions.' }, { status: 500 });
  }
  return NextResponse.json({ data: data ?? [], count });
});
