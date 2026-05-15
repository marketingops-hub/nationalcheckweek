import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { submitAmbassadorApplication } from '@/lib/hubspot';
import { ambassadorApplySchema, safeValidate } from '@/lib/adminSchemas';
import * as rateLimit from '@/lib/rateLimit';

export const runtime = 'edge';

const limiter = rateLimit.create('ambassador-apply', { limit: 5, windowSeconds: 300 });

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  const blocked = limiter.check(req);
  if (blocked) return blocked;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const parsed = safeValidate(ambassadorApplySchema, body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const data = parsed.data;

  const sb = anonClient();
  const { error } = await sb.from('ambassador_applications').insert(data);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Submit to HubSpot - surface failures to user
  let hubspotSuccess = false;
  let hubspotError: string | null = null;
  
  try {
    await submitAmbassadorApplication(data);
    hubspotSuccess = true;
  } catch (e) {
    console.error("[HubSpot] apply error:", e);
    hubspotError = e instanceof Error ? e.message : 'HubSpot sync failed';
  }

  return NextResponse.json({ 
    ok: true,
    hubspotSuccess,
    warning: hubspotError ? 'Application saved. Our team will review it shortly.' : undefined
  });
}
