import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { nominee_first_name, nominee_last_name, reason, nominator_name, nominator_email } = body;
  if (!nominee_first_name?.trim() || !nominee_last_name?.trim() || !reason?.trim() || !nominator_name?.trim() || !nominator_email?.trim()) {
    return NextResponse.json({ error: "Nominee name, reason, and your name and email are required." }, { status: 400 });
  }

  const sb = anonClient();
  const { error } = await sb.from('ambassador_nominations').insert({
    nominee_first_name:   nominee_first_name.trim(),
    nominee_last_name:    nominee_last_name.trim(),
    nominee_email:        body.nominee_email?.trim().toLowerCase() || null,
    nominee_phone:        body.nominee_phone?.trim() || null,
    nominee_organisation: body.nominee_organisation?.trim() || null,
    nominee_role_title:   body.nominee_role_title?.trim() || null,
    nominee_state:        body.nominee_state || null,
    category_id:          body.category_id || null,
    reason:               reason.trim(),
    nominee_linkedin:     body.nominee_linkedin?.trim() || null,
    nominator_name:       nominator_name.trim(),
    nominator_email:      nominator_email.trim().toLowerCase(),
    nominator_phone:      body.nominator_phone?.trim() || null,
    nominator_relation:   body.nominator_relation?.trim() || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
