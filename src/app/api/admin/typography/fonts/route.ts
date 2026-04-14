import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth';
import { adminClient } from '@/lib/adminClient';
import { createClient } from '@supabase/supabase-js';
import {
  validateFontFile,
  sanitizeFontName,
  generateFontFilename,
} from '@/lib/fontValidation';

export const runtime = 'edge';

/**
 * GET /api/admin/typography/fonts
 * List all custom fonts
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
      .from('custom_fonts')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ fonts: data || [] });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch custom fonts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/typography/fonts
 * Upload a new custom font
 */
export async function POST(req: NextRequest) {
  const user = await verifyAdminAuth(req);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin access required.' },
      { status: 401 }
    );
  }

  let formData;
  let file;
  let displayName;

  try {
    formData = await req.formData();
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid form data' },
      { status: 400 }
    );
  }

  try {
    file = formData.get('font') as File;
    displayName = formData.get('displayName') as string;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No valid font file provided' },
        { status: 400 }
      );
    }

    // Server-side file size validation (don't trust client)
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      );
    }

    // Validate font file
    const validation = validateFontFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Generate unique filename
    const uuid = crypto.randomUUID();
    const filename = generateFontFilename(file.name, uuid);
    const fontName = sanitizeFontName(displayName || file.name);

    // Check if font name already exists
    const sb = adminClient();
    const { data: existing } = await sb
      .from('custom_fonts')
      .select('id')
      .eq('font_name', fontName)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `A font named "${fontName}" already exists` },
        { status: 409 }
      );
    }

    // Upload to Supabase Storage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('custom-fonts')
      .upload(filename, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('custom-fonts')
      .getPublicUrl(filename);

    // Create database record
    const { data: fontData, error: dbError } = await sb
      .from('custom_fonts')
      .insert({
        font_name: fontName,
        display_name: displayName || fontName,
        file_url: urlData.publicUrl,
        file_format: validation.format!,
        file_size: file.size,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: delete uploaded file
      await supabase.storage.from('custom-fonts').remove([filename]);
      
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(fontData, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to upload font' },
      { status: 500 }
    );
  }
}
