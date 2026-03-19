import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') ?? 'applications';
  const status = searchParams.get('status') ?? '';

  const sb = adminClient();
  const table = type === 'nominations' ? 'ambassador_nominations' : 'ambassador_applications';

  let query = sb
    .from(table)
    .select('*, ambassador_categories(id, name, color, icon)')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [], count });
}
