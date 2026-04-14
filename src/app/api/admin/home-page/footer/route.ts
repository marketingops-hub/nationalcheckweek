import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { adminClient } from '@/lib/adminClient';
import { FooterPatchSchema, parseBody } from '@/lib/adminSchemas';

export const runtime = 'edge';

const FOOTER_ID = '00000000-0000-0000-0000-000000000003';

export const GET = requireAdmin(async () => {
  try {
    const sb = adminClient();
    
    const [settingsRes, linksRes, socialRes] = await Promise.all([
      sb.from('home_footer_settings').select('*').eq('id', FOOTER_ID).single(),
      sb.from('home_footer_links').select('*').order('display_order', { ascending: true }),
      sb.from('home_social_links').select('*').order('display_order', { ascending: true })
    ]);

    if (settingsRes.error) {
      return NextResponse.json({ error: settingsRes.error.message }, { status: 500 });
    }

    return NextResponse.json({
      settings: settingsRes.data,
      links: linksRes.data || [],
      social: socialRes.data || []
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch footer settings' }, { status: 500 });
  }
});

export const PATCH = requireAdmin(async (req: NextRequest) => {
  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });

  const parsed = parseBody(FooterPatchSchema, raw);
  if (!parsed.ok) return parsed.response;

  const sb = adminClient();
  const { data, error } = await sb
    .from('home_footer_settings')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', FOOTER_ID)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
});
