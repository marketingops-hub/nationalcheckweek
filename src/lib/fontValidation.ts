/**
 * Font file validation utilities
 */

export const ALLOWED_FONT_FORMATS = ['woff2', 'woff', 'ttf'] as const;
export const ALLOWED_MIME_TYPES = [
  'font/woff2',
  'font/woff',
  'font/ttf',
  'application/font-woff2',
  'application/font-woff',
  'application/x-font-woff',
  'application/x-font-ttf',
  'application/x-font-truetype',
] as const;

export const MAX_FONT_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export interface FontValidationResult {
  valid: boolean;
  error?: string;
  format?: string;
}

/**
 * Validate font file format by extension
 */
export function validateFontFormat(filename: string): FontValidationResult {
  const ext = filename.toLowerCase().split('.').pop();
  
  if (!ext || !(ALLOWED_FONT_FORMATS as readonly string[]).includes(ext)) {
    return {
      valid: false,
      error: `Invalid font format. Allowed formats: ${ALLOWED_FONT_FORMATS.join(', ')}`,
    };
  }
  
  return { valid: true, format: ext };
}

/**
 * Validate font file size
 */
export function validateFontSize(size: number): FontValidationResult {
  if (size > MAX_FONT_FILE_SIZE) {
    return {
      valid: false,
      error: `Font file too large. Maximum size: ${MAX_FONT_FILE_SIZE / 1024 / 1024}MB`,
    };
  }
  
  if (size === 0) {
    return {
      valid: false,
      error: 'Font file is empty',
    };
  }
  
  return { valid: true };
}

/**
 * Validate font MIME type
 */
export function validateFontMimeType(mimeType: string): FontValidationResult {
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return {
      valid: false,
      error: `Invalid MIME type: ${mimeType}`,
    };
  }
  
  return { valid: true };
}

/**
 * Sanitize font name for use as CSS font-family
 */
export function sanitizeFontName(name: string): string {
  // Remove file extension
  let sanitized = name.replace(/\.(woff2|woff|ttf)$/i, '');
  
  // Replace special characters with spaces
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s-]/g, ' ');
  
  // Collapse multiple spaces
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  // Capitalize words
  sanitized = sanitized
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return sanitized;
}

/**
 * Generate unique font filename
 */
export function generateFontFilename(originalName: string, uuid: string): string {
  const ext = originalName.toLowerCase().split('.').pop();
  const sanitized = originalName
    .replace(/\.(woff2|woff|ttf)$/i, '')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .toLowerCase();
  
  return `${sanitized}-${uuid}.${ext}`;
}

/**
 * Validate complete font file
 */
export function validateFontFile(
  file: File
): FontValidationResult {
  // Check format
  const formatResult = validateFontFormat(file.name);
  if (!formatResult.valid) return formatResult;
  
  // Check size
  const sizeResult = validateFontSize(file.size);
  if (!sizeResult.valid) return sizeResult;
  
  // Check MIME type
  const mimeResult = validateFontMimeType(file.type);
  if (!mimeResult.valid) return mimeResult;
  
  return { valid: true, format: formatResult.format };
}
