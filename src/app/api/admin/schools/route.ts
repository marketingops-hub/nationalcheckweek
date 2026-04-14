import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'edge';

export const GET = requireAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const state = searchParams.get('state') ?? '';
  const sector = searchParams.get('sector') ?? '';
  const limit = Math.min(Number(searchParams.get('limit') ?? '200'), 500);

  const sb = adminClient();
  let query = sb
    .from('school_profiles')
    .select('id, acara_sml_id, school_name, suburb, state, postcode, school_sector, school_type, year_range, geolocation, icsea, total_enrolments, created_at')
    .order('school_name')
    .limit(limit);

  if (q) query = query.ilike('school_name', `%${q}%`);
  if (state) query = query.eq('state', state);
  if (sector) query = query.eq('school_sector', sector);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count });
});
