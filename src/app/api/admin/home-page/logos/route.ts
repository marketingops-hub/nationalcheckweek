import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth';
import { adminClient } from '@/lib/adminClient';
import { LogoPostSchema, parseBody } from '@/lib/adminSchemas';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const user = await verifyAdminAuth(req);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin access required.' },
      { status: 401 }
    );
  }

  try {
    const sb = adminClient();
    const { data, error } = await sb
      .from('home_trusted_logos')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ logos: data || [] });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch logos' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await verifyAdminAuth(req);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin access required.' },
      { status: 401 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const parsed = parseBody(LogoPostSchema, body);
  if (!parsed.ok) return parsed.response;

  try {
    const sb = adminClient();
    const { data, error } = await sb
      .from('home_trusted_logos')
      .insert(parsed.data)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to create logo' },
      { status: 500 }
    );
  }
}
