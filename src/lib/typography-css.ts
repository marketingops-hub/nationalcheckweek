import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { getFontFamilyVariable } from '@/lib/typography';

/**
 * Sanitizes CSS to prevent XSS via injection.
 * Removes dangerous rules like @import, javascript: URLs, expression(), etc.
 */
function sanitizeCss(css: string): string {
  if (!css || typeof css !== 'string') return '';

  // Remove potentially dangerous CSS constructs
  return css
    // Remove @import rules (could load external malicious CSS)
    .replace(/@import\s+[^;]+;/gi, '')
    // Remove @charset rules
    .replace(/@charset\s+[^;]+;/gi, '')
    // Remove expression() (IE-specific JavaScript in CSS)
    .replace(/expression\s*\([^)]+\)/gi, '')
    // Remove javascript: URLs
    .replace(/javascript\s*:\s*[^;\}]+/gi, '')
    // Remove data: URLs that aren't images (audio/video can be dangerous)
    .replace(/data\s*:\s*(?!image)[^;\}]+/gi, '')
    // Remove behavior: URLs (IE htc files)
    .replace(/behavior\s*:\s*[^;\}]+/gi, '')
    // Remove any -moz-binding (XBL)
    .replace(/-moz-binding\s*:\s*[^;\}]+/gi, '')
    // Trim and validate it's actually CSS-like content
    .trim();
}

/**
 * Generates the dynamic typography CSS server-side and caches it for 5 minutes.
 * Used by layout.tsx to inject as an inline <style> tag instead of a render-blocking
 * <link rel="stylesheet"> to the /api/typography/css endpoint.
 */
export const getTypographyCssInline = unstable_cache(
  async (): Promise<string> => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const [{ data: settings, error: settingsError }, { data: fonts }] = await Promise.all([
        supabase
          .from('typography_settings')
          .select('*')
          .eq('id', '00000000-0000-0000-0000-000000000001')
          .single(),
        supabase.from('custom_fonts').select('*').eq('is_active', true),
      ]);

      if (settingsError || !settings) return '';

      let css = '';

      if (fonts && fonts.length > 0) {
        for (const font of fonts) {
          const format = font.file_format === 'ttf' ? 'truetype' : font.file_format;
          css += `@font-face{font-family:'${font.font_name}';src:url('${font.file_url}') format('${format}');font-display:swap;}\n`;
        }
      }

      css += `:root{
--h1-font-family:${getFontFamilyVariable(settings.h1_font_family)};
--h1-font-size:${settings.h1_font_size};
--h1-font-weight:${settings.h1_font_weight};
--h1-line-height:${settings.h1_line_height};
--h2-font-family:${getFontFamilyVariable(settings.h2_font_family)};
--h2-font-size:${settings.h2_font_size};
--h2-font-weight:${settings.h2_font_weight};
--h2-line-height:${settings.h2_line_height};
--h3-font-family:${getFontFamilyVariable(settings.h3_font_family)};
--h3-font-size:${settings.h3_font_size};
--h3-font-weight:${settings.h3_font_weight};
--h3-line-height:${settings.h3_line_height};
--body-font-family:${getFontFamilyVariable(settings.body_font_family)};
--body-font-size:${settings.body_font_size};
--body-font-weight:${settings.body_font_weight};
--body-line-height:${settings.body_line_height};
--nav-font-family:${getFontFamilyVariable(settings.nav_font_family)};
--nav-font-size:${settings.nav_font_size};
--nav-font-weight:${settings.nav_font_weight};
--footer-font-family:${getFontFamilyVariable(settings.footer_font_family)};
--footer-font-size:${settings.footer_font_size};
--footer-font-weight:${settings.footer_font_weight};
--subtitle-font-family:${getFontFamilyVariable(settings.subtitle_font_family)};
--subtitle-font-size:${settings.subtitle_font_size};
--subtitle-font-weight:${settings.subtitle_font_weight};
--subtitle-line-height:${settings.subtitle_line_height};
}
h1{font-family:var(--h1-font-family,var(--font-display));font-size:var(--h1-font-size,clamp(2.4rem,5vw,3.75rem));font-weight:var(--h1-font-weight,900);line-height:var(--h1-line-height,1.1);}
h2{font-family:var(--h2-font-family,var(--font-display));font-size:var(--h2-font-size,clamp(1.75rem,3vw,2.5rem));font-weight:var(--h2-font-weight,800);line-height:var(--h2-line-height,1.2);}
h3{font-family:var(--h3-font-family,var(--font-display));font-size:var(--h3-font-size,1.3rem);font-weight:var(--h3-font-weight,700);line-height:var(--h3-line-height,1.3);}
body{font-family:var(--body-font-family,var(--font-body));font-size:var(--body-font-size,16px);font-weight:var(--body-font-weight,400);line-height:var(--body-line-height,1.7);}
p{font-family:var(--body-font-family,var(--font-body));font-size:var(--body-font-size,16px);line-height:var(--body-line-height,1.7);}`;

      // Sanitize CSS before returning to prevent XSS via injection
      return sanitizeCss(css);
    } catch {
      return '';
    }
  },
  ['typography-css-inline'],
  { revalidate: 300 }
);
