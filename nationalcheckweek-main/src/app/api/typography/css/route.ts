import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getFontFamilyVariable } from '@/lib/typography';

export const runtime = 'edge';

// Cache for 5 minutes
export const revalidate = 300;

/**
 * GET /api/typography/css
 * Generate dynamic CSS with typography settings and custom fonts
 * Public endpoint - no authentication required
 */
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch typography settings
    const { data: settings, error: settingsError } = await supabase
      .from('typography_settings')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    if (settingsError) {
      console.error('Failed to fetch typography settings:', settingsError);
      return new NextResponse('/* Typography settings not found */', {
        headers: { 'Content-Type': 'text/css' },
      });
    }

    // Fetch custom fonts
    const { data: fonts, error: fontsError } = await supabase
      .from('custom_fonts')
      .select('*')
      .eq('is_active', true);

    if (fontsError) {
      console.error('Failed to fetch custom fonts:', fontsError);
    }

    // Generate CSS
    let css = '/* Auto-generated typography CSS */\n\n';

    // Add @font-face declarations for custom fonts
    if (fonts && fonts.length > 0) {
      css += '/* Custom Fonts */\n';
      for (const font of fonts) {
        const format = font.file_format === 'ttf' ? 'truetype' : font.file_format;
        css += `@font-face {
  font-family: '${font.font_name}';
  src: url('${font.file_url}') format('${format}');
  font-display: swap;
}\n\n`;
      }
    }

    // Add CSS custom properties
    css += `:root {
  /* H1 Typography */
  --h1-font-family: ${getFontFamilyVariable(settings.h1_font_family)};
  --h1-font-size: ${settings.h1_font_size};
  --h1-font-weight: ${settings.h1_font_weight};
  --h1-line-height: ${settings.h1_line_height};
  
  /* H2 Typography */
  --h2-font-family: ${getFontFamilyVariable(settings.h2_font_family)};
  --h2-font-size: ${settings.h2_font_size};
  --h2-font-weight: ${settings.h2_font_weight};
  --h2-line-height: ${settings.h2_line_height};
  
  /* H3 Typography */
  --h3-font-family: ${getFontFamilyVariable(settings.h3_font_family)};
  --h3-font-size: ${settings.h3_font_size};
  --h3-font-weight: ${settings.h3_font_weight};
  --h3-line-height: ${settings.h3_line_height};
  
  /* Body Typography */
  --body-font-family: ${getFontFamilyVariable(settings.body_font_family)};
  --body-font-size: ${settings.body_font_size};
  --body-font-weight: ${settings.body_font_weight};
  --body-line-height: ${settings.body_line_height};
  
  /* Navigation Typography */
  --nav-font-family: ${getFontFamilyVariable(settings.nav_font_family)};
  --nav-font-size: ${settings.nav_font_size};
  --nav-font-weight: ${settings.nav_font_weight};
  
  /* Footer Typography */
  --footer-font-family: ${getFontFamilyVariable(settings.footer_font_family)};
  --footer-font-size: ${settings.footer_font_size};
  --footer-font-weight: ${settings.footer_font_weight};
  
  /* Subtitle Typography */
  --subtitle-font-family: ${getFontFamilyVariable(settings.subtitle_font_family)};
  --subtitle-font-size: ${settings.subtitle_font_size};
  --subtitle-font-weight: ${settings.subtitle_font_weight};
  --subtitle-line-height: ${settings.subtitle_line_height};
}

/* Apply typography to elements */
h1 {
  font-family: var(--h1-font-family, var(--font-display));
  font-size: var(--h1-font-size, clamp(2.4rem, 5vw, 3.75rem));
  font-weight: var(--h1-font-weight, 900);
  line-height: var(--h1-line-height, 1.1);
}

h2 {
  font-family: var(--h2-font-family, var(--font-display));
  font-size: var(--h2-font-size, clamp(1.75rem, 3vw, 2.5rem));
  font-weight: var(--h2-font-weight, 800);
  line-height: var(--h2-line-height, 1.2);
}

h3 {
  font-family: var(--h3-font-family, var(--font-display));
  font-size: var(--h3-font-size, 1.3rem);
  font-weight: var(--h3-font-weight, 700);
  line-height: var(--h3-line-height, 1.3);
}

body {
  font-family: var(--body-font-family, var(--font-body));
  font-size: var(--body-font-size, 16px);
  font-weight: var(--body-font-weight, 400);
  line-height: var(--body-line-height, 1.7);
}

p {
  font-family: var(--body-font-family, var(--font-body));
  font-size: var(--body-font-size, 16px);
  line-height: var(--body-line-height, 1.7);
}
`;

    return new NextResponse(css, {
      headers: {
        'Content-Type': 'text/css',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  } catch (err) {
    console.error('Error generating typography CSS:', err);
    return new NextResponse('/* Error generating typography CSS */', {
      headers: { 'Content-Type': 'text/css' },
      status: 500,
    });
  }
}
