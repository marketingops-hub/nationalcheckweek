/**
 * Typography validation and utilities
 */

export const DEFAULT_FONTS = [
  'Montserrat',
  'Poppins',
  'Inter',
  'Cormorant Garamond',
] as const;

export const FONT_WEIGHTS = [
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
] as const;

export interface TypographySettings {
  // H1
  h1_font_family: string;
  h1_font_size: string;
  h1_font_weight: string;
  h1_line_height: string;
  
  // H2
  h2_font_family: string;
  h2_font_size: string;
  h2_font_weight: string;
  h2_line_height: string;
  
  // H3
  h3_font_family: string;
  h3_font_size: string;
  h3_font_weight: string;
  h3_line_height: string;
  
  // Body
  body_font_family: string;
  body_font_size: string;
  body_font_weight: string;
  body_line_height: string;
  
  // Nav
  nav_font_family: string;
  nav_font_size: string;
  nav_font_weight: string;
  
  // Footer
  footer_font_family: string;
  footer_font_size: string;
  footer_font_weight: string;
  
  // Subtitle
  subtitle_font_family: string;
  subtitle_font_size: string;
  subtitle_font_weight: string;
  subtitle_line_height: string;
}

/**
 * Validate CSS font size value
 */
export function validateFontSize(size: string): { valid: boolean; error?: string } {
  // Allow common CSS units: px, rem, em, %, vw, vh, clamp()
  const validPattern = /^(clamp\([^)]+\)|[\d.]+(?:px|rem|em|%|vw|vh))$/i;
  
  if (!validPattern.test(size.trim())) {
    return {
      valid: false,
      error: 'Invalid font size. Use px, rem, em, %, vw, vh, or clamp()',
    };
  }
  
  return { valid: true };
}

/**
 * Validate font weight
 */
export function validateFontWeight(weight: string): { valid: boolean; error?: string } {
  if (!(FONT_WEIGHTS as readonly string[]).includes(weight)) {
    return {
      valid: false,
      error: `Invalid font weight. Must be one of: ${FONT_WEIGHTS.join(', ')}`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate line height
 */
export function validateLineHeight(lineHeight: string): { valid: boolean; error?: string } {
  // Allow unitless numbers (1.5) or with units (1.5rem, 24px)
  const validPattern = /^[\d.]+(?:px|rem|em)?$/;
  
  if (!validPattern.test(lineHeight.trim())) {
    return {
      valid: false,
      error: 'Invalid line height. Use unitless number (1.5) or with units (1.5rem, 24px)',
    };
  }
  
  const numValue = parseFloat(lineHeight);
  if (numValue < 0.5 || numValue > 3.0) {
    return {
      valid: false,
      error: 'Line height must be between 0.5 and 3.0',
    };
  }
  
  return { valid: true };
}

/**
 * Validate typography settings object
 */
export function validateTypographySettings(
  settings: Partial<TypographySettings>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  // Validate font sizes
  const sizeFields = [
    'h1_font_size',
    'h2_font_size',
    'h3_font_size',
    'body_font_size',
    'nav_font_size',
    'footer_font_size',
    'subtitle_font_size',
  ] as const;
  
  for (const field of sizeFields) {
    if (settings[field]) {
      const result = validateFontSize(settings[field]!);
      if (!result.valid) {
        errors[field] = result.error!;
      }
    }
  }
  
  // Validate font weights
  const weightFields = [
    'h1_font_weight',
    'h2_font_weight',
    'h3_font_weight',
    'body_font_weight',
    'nav_font_weight',
    'footer_font_weight',
    'subtitle_font_weight',
  ] as const;
  
  for (const field of weightFields) {
    if (settings[field]) {
      const result = validateFontWeight(settings[field]!);
      if (!result.valid) {
        errors[field] = result.error!;
      }
    }
  }
  
  // Validate line heights
  const lineHeightFields = [
    'h1_line_height',
    'h2_line_height',
    'h3_line_height',
    'body_line_height',
    'subtitle_line_height',
  ] as const;
  
  for (const field of lineHeightFields) {
    if (settings[field]) {
      const result = validateLineHeight(settings[field]!);
      if (!result.valid) {
        errors[field] = result.error!;
      }
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Map font family to CSS variable name
 */
export function getFontFamilyVariable(fontFamily: string): string {
  const mapping: Record<string, string> = {
    'Montserrat': 'var(--font-montserrat)',
    'Poppins': 'var(--font-poppins)',
    'Inter': 'var(--font-inter)',
    'Cormorant Garamond': 'var(--font-cormorant)',
  };
  
  return mapping[fontFamily] || fontFamily;
}
