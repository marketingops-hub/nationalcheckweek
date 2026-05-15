import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth';
import { adminClient } from '@/lib/adminClient';
import { validateTypographySettings } from '@/lib/typography';

export const runtime = 'edge';

/**
 * GET /api/admin/typography
 * Fetch current typography settings
 */
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
      .from('typography_settings')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch typography settings' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/typography
 * Update typography settings
 */
export async function PATCH(req: NextRequest) {
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

  try {
    // Validate settings
    const validation = validateTypographySettings(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Update settings
    const sb = adminClient();
    const { data, error } = await sb
      .from('typography_settings')
      .update(body)
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to update typography settings' },
      { status: 500 }
    );
  }
}
