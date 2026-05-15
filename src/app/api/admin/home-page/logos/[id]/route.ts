import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth';
import { adminClient } from '@/lib/adminClient';
import { LogoPatchSchema, parseBody } from '@/lib/adminSchemas';

export const runtime = 'edge';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await verifyAdminAuth(req);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin access required.' },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  let body;
  try {
    body = await req.json();
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const parsed = parseBody(LogoPatchSchema, body);
  if (!parsed.ok) return parsed.response;

  try {
    const sb = adminClient();
    const { data, error } = await sb
      .from('home_trusted_logos')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to update logo' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await verifyAdminAuth(req);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin access required.' },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  try {
    const sb = adminClient();
    const { error } = await sb
      .from('home_trusted_logos')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to delete logo' },
      { status: 500 }
    );
  }
}
