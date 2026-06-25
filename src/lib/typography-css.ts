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
 * Strip characters that let a stored value break out of its CSS declaration
 * and inject new rules (e.g. a font_family of `Arial} body{background:url(...)`).
 * Removes the structural CSS characters `{ } ; : ( ) < > "` and newlines, and
 * caps length. Applied to every value interpolated into the template below.
 */
function cssValue(v: unknown): string {
  if (v == null) return '';
  return String(v).replace(/[{};:()<>"\n\r]/g, '').trim().slice(0, 200);
}

/**
 * Validate a font file URL for use inside `url('...')`. Only same-shape
 * https URLs with no quote/paren/space breakout characters are allowed;
 * anything else yields '' so the @font-face src is simply omitted.
 */
function safeFontUrl(v: unknown): string {
  const s = String(v ?? '').trim();
  if (!/^https:\/\/[^\s'"()<>]+$/i.test(s)) return '';
  return s.slice(0, 1000);
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
          const format = cssValue(font.file_format === 'ttf' ? 'truetype' : font.file_format);
          const name   = cssValue(font.font_name);
          const url    = safeFontUrl(font.file_url);
          // Skip fonts whose URL or name didn't survive validation, rather
          // than emit a half-formed (and potentially injectable) rule.
          if (!name || !url) continue;
          css += `@font-face{font-family:'${name}';src:url('${url}') format('${format}');font-display:swap;}\n`;
        }
      }

      // getFontFamilyVariable maps known families to CSS vars; unknown values
      // pass through, so run them (and every other stored value) through
      // cssValue() to neutralise CSS-breakout attempts on the raw fields.
      const ff = (v: string) => cssValue(getFontFamilyVariable(v));
      css += `:root{
--h1-font-family:${ff(settings.h1_font_family)};
--h1-font-size:${cssValue(settings.h1_font_size)};
--h1-font-weight:${cssValue(settings.h1_font_weight)};
--h1-line-height:${cssValue(settings.h1_line_height)};
--h2-font-family:${ff(settings.h2_font_family)};
--h2-font-size:${cssValue(settings.h2_font_size)};
--h2-font-weight:${cssValue(settings.h2_font_weight)};
--h2-line-height:${cssValue(settings.h2_line_height)};
--h3-font-family:${ff(settings.h3_font_family)};
--h3-font-size:${cssValue(settings.h3_font_size)};
--h3-font-weight:${cssValue(settings.h3_font_weight)};
--h3-line-height:${cssValue(settings.h3_line_height)};
--body-font-family:${ff(settings.body_font_family)};
--body-font-size:${cssValue(settings.body_font_size)};
--body-font-weight:${cssValue(settings.body_font_weight)};
--body-line-height:${cssValue(settings.body_line_height)};
--nav-font-family:${ff(settings.nav_font_family)};
--nav-font-size:${cssValue(settings.nav_font_size)};
--nav-font-weight:${cssValue(settings.nav_font_weight)};
--footer-font-family:${ff(settings.footer_font_family)};
--footer-font-size:${cssValue(settings.footer_font_size)};
--footer-font-weight:${cssValue(settings.footer_font_weight)};
--subtitle-font-family:${ff(settings.subtitle_font_family)};
--subtitle-font-size:${cssValue(settings.subtitle_font_size)};
--subtitle-font-weight:${cssValue(settings.subtitle_font_weight)};
--subtitle-line-height:${cssValue(settings.subtitle_line_height)};
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
