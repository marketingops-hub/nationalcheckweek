import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'edge';

/**
 * POST /api/admin/setup-blog
 * DEPRECATED — exec_sql RPC removed for security.
 * Schema is managed via Supabase migrations in supabase/migrations/.
 */
export const POST = requireAdmin(async () => {
  return NextResponse.json(
    { error: 'This endpoint has been deprecated. Run schema changes via Supabase migrations.' },
    { status: 410 }
  );
});
