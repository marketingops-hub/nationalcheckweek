import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth';
import { adminClient } from '@/lib/adminClient';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * DELETE /api/admin/typography/fonts/[id]
 * Delete a custom font
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAdminAuth(req);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin access required.' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const sb = adminClient();

    // Get font details first
    const { data: font, error: fetchError } = await sb
      .from('custom_fonts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !font) {
      return NextResponse.json(
        { error: 'Font not found' },
        { status: 404 }
      );
    }

    // Extract filename from URL
    const filename = font.file_url.split('/').pop();
    if (!filename) {
      return NextResponse.json(
        { error: 'Invalid font URL' },
        { status: 500 }
      );
    }

    // Delete from storage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: storageError } = await supabase.storage
      .from('custom-fonts')
      .remove([filename]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue anyway - database record is more important
    }

    // Delete from database
    const { error: dbError } = await sb
      .from('custom_fonts')
      .delete()
      .eq('id', id);

    if (dbError) {
      return NextResponse.json(
        { error: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to delete font' },
      { status: 500 }
    );
  }
}
