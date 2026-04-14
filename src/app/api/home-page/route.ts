import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const revalidate = 60; // Cache for 1 minute

/**
 * GET /api/home-page
 * Public endpoint to fetch all home page settings
 */
export async function GET(req: NextRequest) {
  try {
    const sb = await createClient();
    
    const [heroRes, logosRes, ctaRes, footerRes, linksRes, socialRes] = await Promise.all([
      sb.from('home_hero_settings').select('*').eq('id', '00000000-0000-0000-0000-000000000001').single(),
      sb.from('home_trusted_logos').select('*').eq('is_active', true).order('display_order', { ascending: true }),
      sb.from('home_cta_settings').select('*').eq('id', '00000000-0000-0000-0000-000000000002').single(),
      sb.from('home_footer_settings').select('*').eq('id', '00000000-0000-0000-0000-000000000003').single(),
      sb.from('home_footer_links').select('*').eq('is_active', true).order('display_order', { ascending: true }),
      sb.from('home_social_links').select('*').eq('is_active', true).order('display_order', { ascending: true })
    ]);

    return NextResponse.json(
      {
        hero: heroRes.data || null,
        logos: logosRes.data || [],
        cta: ctaRes.data || null,
        footer: {
          settings: footerRes.data || null,
          links: linksRes.data || [],
          social: socialRes.data || []
        }
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=120'
        }
      }
    );
  } catch (err) {
    console.error('Failed to fetch home page settings:', err);
    return NextResponse.json(
      { error: 'Failed to fetch home page settings' },
      { status: 500 }
    );
  }
}
