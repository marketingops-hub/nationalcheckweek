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

  const { first_name, last_name, email, why_ambassador } = body;
  if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !why_ambassador?.trim()) {
    return NextResponse.json({ error: 'First name, last name, email and motivation are required.' }, { status: 400 });
  }

  const sb = anonClient();
  const { error } = await sb.from('ambassador_applications').insert({
    first_name:     first_name.trim(),
    last_name:      last_name.trim(),
    email:          email.trim().toLowerCase(),
    phone:          body.phone?.trim() || null,
    organisation:   body.organisation?.trim() || null,
    role_title:     body.role_title?.trim() || null,
    state:          body.state || null,
    category_id:    body.category_id || null,
    why_ambassador: why_ambassador.trim(),
    experience:     body.experience?.trim() || null,
    linkedin_url:   body.linkedin_url?.trim() || null,
    website_url:    body.website_url?.trim() || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
