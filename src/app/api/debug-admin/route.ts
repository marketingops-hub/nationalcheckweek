import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth';

export const GET = requireAdmin(async (_req: NextRequest) => {
  const checks: Record<string, string> = {};

  checks.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'MISSING';
  checks.SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'MISSING';
  checks.SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING';

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    checks.getUser = error ? `error: ${error.message}` : `ok, user: ${data.user?.email ?? 'null'}`;

    const { error: e2 } = await supabase.from('states').select('id').limit(1);
    checks.states_table = e2 ? `error: ${e2.message}` : 'ok';

    const { error: e3 } = await supabase.from('areas').select('id').limit(1);
    checks.areas_table = e3 ? `error: ${e3.message}` : 'ok';

    const { error: e4 } = await supabase.from('prompt_templates').select('id').limit(1);
    checks.prompt_templates_table = e4 ? `error: ${e4.message}` : 'ok';

    const { error: e5 } = await supabase.from('generation_log').select('id').limit(1);
    checks.generation_log_table = e5 ? `error: ${e5.message}` : 'ok';

    const { error: e6 } = await supabase.from('pages').select('id').limit(1);
    checks.pages_table = e6 ? `error: ${e6.message}` : 'ok';

    const { error: e7 } = await supabase.from('redirects').select('id').limit(1);
    checks.redirects_table = e7 ? `error: ${e7.message}` : 'ok';

    const { error: e8 } = await supabase.from('vault_sources').select('id').limit(1);
    checks.vault_sources_table = e8 ? `error: ${e8.message}` : 'ok';

    const { error: e9 } = await supabase.from('api_keys').select('id').limit(1);
    checks.api_keys_table = e9 ? `error: ${e9.message}` : 'ok';
  } catch (e) {
    checks.fatal = `threw: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json(checks);
});
