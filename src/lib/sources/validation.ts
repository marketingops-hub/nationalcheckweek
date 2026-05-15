/**
 * Input validation for source management system
 * 
 * Provides comprehensive validation for source URLs, titles, entity types,
 * and other source-related fields. All functions return ValidationResult
 * with consistent error messaging.
 * 
 * @module sources/validation
 */

import type { EntityType, Relevance, SourceCategory } from './types';

const VALID_ENTITY_TYPES: EntityType[] = ['area', 'state', 'issue', 'content', 'research_theme'];
const VALID_RELEVANCE: Relevance[] = ['primary', 'secondary', 'reference'];
const VALID_CATEGORIES: SourceCategory[] = ['mental_health', 'research', 'government', 'general'];

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
  warning?: string | null;
}

/**
 * Validate URL format and protocol
 * 
 * Checks if URL is a valid HTTP/HTTPS URL. Does not check specificity.
 * Use checkUrlSpecificity() for specificity warnings.
 * 
 * @param url - The URL string to validate
 * @returns ValidationResult with error if invalid
 * 
 * @example
 * ```typescript
 * validateUrl('https://example.com')
 * // { isValid: true, error: null }
 * 
 * validateUrl('not-a-url')
 * // { isValid: false, error: 'Invalid URL format' }
 * 
 * validateUrl('ftp://example.com')
 * // { isValid: false, error: 'URL must use HTTP or HTTPS protocol' }
 * ```
 */
export function validateUrl(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  const trimmed = url.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'URL cannot be empty' };
  }

  try {
    const parsed = new URL(trimmed);
    
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }
    
    return { isValid: true, error: null };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * Check URL specificity and return warning if too generic
 * 
 * Analyzes URL structure to determine if it points to a specific page/section
 * or is too generic (homepage, section page, etc.). Returns warning message
 * if URL should be more specific, null if acceptable.
 * 
 * Criteria for specific URL:
 * - More than 2 path segments, OR
 * - Has anchor link (#section), OR
 * - Has query parameters (?key=value)
 * 
 * @param url - The URL to check for specificity
 * @returns Warning message if URL is too generic, null if specific enough
 * 
 * @example
 * ```typescript
 * // Homepage - returns warning
 * checkUrlSpecificity('https://example.com')
 * // "⚠️ Warning: This URL points to the homepage..."
 * 
 * // Too generic - returns warning
 * checkUrlSpecificity('https://example.com/reports')
 * // "⚠️ Warning: This URL may be too generic..."
 * 
 * // Specific enough - returns null
 * checkUrlSpecificity('https://example.com/reports/2024#data')
 * // null
 * 
 * // Specific enough - returns null
 * checkUrlSpecificity('https://example.com/reports/2024/summary')
 * // null
 * ```
 */
export function checkUrlSpecificity(url: string): string | null {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    const pathSegments = parsed.pathname.split('/').filter(s => s.length > 0);
    
    // Homepage only (e.g., https://example.com or https://example.com/)
    if (pathSegments.length === 0) {
      return '⚠️ Warning: This URL points to the homepage. Please provide the exact page where the data was found (e.g., /reports/2024/summary#statistics)';
    }
    
    // Too generic (only 1-2 path segments, no anchor, no query params)
    if (pathSegments.length <= 2 && !parsed.hash && !parsed.search) {
      return '⚠️ Warning: This URL may be too generic. Consider adding the specific section or page (e.g., #key-findings or /full-report)';
    }
    
    // Generic section pages
    if (parsed.pathname.match(/\/(states|areas|issues)\/[^/]+$/) && !parsed.hash) {
      return '⚠️ Warning: This appears to be a section page. Please link to the specific data/statistics section (e.g., #statistics or #data)';
    }
    
    return null; // URL appears specific enough
  } catch {
    return null; // Invalid URL, will be caught by validateUrl
  }
}

/**
 * Validate source title
 * 
 * Ensures title is a non-empty string between 3-200 characters.
 * 
 * @param title - The title string to validate
 * @returns ValidationResult with error if invalid
 * 
 * @example
 * ```typescript
 * validateTitle('AIHW Youth Mental Health Report 2024')
 * // { isValid: true, error: null }
 * 
 * validateTitle('AB')
 * // { isValid: false, error: 'Title must be at least 3 characters' }
 * ```
 */
export function validateTitle(title: string): ValidationResult {
  if (!title || typeof title !== 'string') {
    return { isValid: false, error: 'Title is required' };
  }

  const trimmed = title.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'Title cannot be empty' };
  }

  if (trimmed.length < 3) {
    return { isValid: false, error: 'Title must be at least 3 characters' };
  }

  if (trimmed.length > 200) {
    return { isValid: false, error: 'Title must be less than 200 characters' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate entity type
 * 
 * Ensures entity type is one of the valid types: area, state, issue, content, research_theme.
 * 
 * @param entityType - The entity type to validate
 * @returns ValidationResult with error if invalid
 * 
 * @example
 * ```typescript
 * validateEntityType('area')
 * // { isValid: true, error: null }
 * 
 * validateEntityType('invalid')
 * // { isValid: false, error: 'Invalid entity type. Must be one of: area, state, issue, content, research_theme' }
 * ```
 */
export function validateEntityType(entityType: string): ValidationResult {
  if (!entityType || typeof entityType !== 'string') {
    return { isValid: false, error: 'Entity type is required' };
  }

  const trimmed = entityType.trim().toLowerCase();
  
  if (!VALID_ENTITY_TYPES.includes(trimmed as EntityType)) {
    return { 
      isValid: false, 
      error: `Invalid entity type. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}` 
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validate entity slug
 * 
 * Ensures slug is lowercase alphanumeric with hyphens, 2-100 characters.
 * 
 * @param slug - The entity slug to validate
 * @returns ValidationResult with error if invalid
 * 
 * @example
 * ```typescript
 * validateEntitySlug('melbourne')
 * // { isValid: true, error: null }
 * 
 * validateEntitySlug('Melbourne City')
 * // { isValid: false, error: 'Entity slug must contain only lowercase letters, numbers, and hyphens' }
 * ```
 */
export function validateEntitySlug(slug: string): ValidationResult {
  if (!slug || typeof slug !== 'string') {
    return { isValid: false, error: 'Entity slug is required' };
  }

  const trimmed = slug.trim().toLowerCase();
  
  if (!trimmed) {
    return { isValid: false, error: 'Entity slug cannot be empty' };
  }

  // Slug should be lowercase alphanumeric with hyphens
  const slugPattern = /^[a-z0-9-]+$/;
  if (!slugPattern.test(trimmed)) {
    return { 
      isValid: false, 
      error: 'Entity slug must contain only lowercase letters, numbers, and hyphens' 
    };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Entity slug must be at least 2 characters' };
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: 'Entity slug must be less than 100 characters' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate source relevance
 * 
 * Ensures relevance is one of: primary, secondary, reference.
 * 
 * @param relevance - The relevance level to validate
 * @returns ValidationResult with error if invalid
 * 
 * @example
 * ```typescript
 * validateRelevance('primary')
 * // { isValid: true, error: null }
 * ```
 */
export function validateRelevance(relevance: string): ValidationResult {
  if (!relevance || typeof relevance !== 'string') {
    return { isValid: false, error: 'Relevance is required' };
  }

  const trimmed = relevance.trim().toLowerCase();
  
  if (!VALID_RELEVANCE.includes(trimmed as Relevance)) {
    return { 
      isValid: false, 
      error: `Invalid relevance. Must be one of: ${VALID_RELEVANCE.join(', ')}` 
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validate source category
 * 
 * Ensures category is one of: mental_health, research, government, general.
 * 
 * @param category - The category to validate
 * @returns ValidationResult with error if invalid
 * 
 * @example
 * ```typescript
 * validateCategory('mental_health')
 * // { isValid: true, error: null }
 * ```
 */
export function validateCategory(category: string): ValidationResult {
  if (!category || typeof category !== 'string') {
    return { isValid: false, error: 'Category is required' };
  }

  const trimmed = category.trim().toLowerCase();
  
  if (!VALID_CATEGORIES.includes(trimmed as SourceCategory)) {
    return { 
      isValid: false, 
      error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` 
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validate source description (optional field)
 * 
 * Description is optional but if provided must be less than 1000 characters.
 * 
 * @param description - The description to validate (optional)
 * @returns ValidationResult with error if invalid
 * 
 * @example
 * ```typescript
 * validateDescription(undefined)
 * // { isValid: true, error: null }
 * 
 * validateDescription('A comprehensive report on youth mental health')
 * // { isValid: true, error: null }
 * ```
 */
export function validateDescription(description: string | undefined): ValidationResult {
  if (!description) {
    return { isValid: true, error: null }; // Optional field
  }

  if (typeof description !== 'string') {
    return { isValid: false, error: 'Description must be a string' };
  }

  if (description.trim().length > 1000) {
    return { isValid: false, error: 'Description must be less than 1000 characters' };
  }

  return { isValid: true, error: null };
}

/**
 * Sanitize string input by trimming and normalizing whitespace
 * 
 * Removes leading/trailing whitespace and collapses multiple spaces to single space.
 * 
 * @param input - The string to sanitize
 * @returns Sanitized string
 * 
 * @example
 * ```typescript
 * sanitizeString('  Hello   World  ')
 * // 'Hello World'
 * ```
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Normalize entity slug to lowercase and trim whitespace
 * 
 * @param slug - The slug to normalize
 * @returns Normalized slug
 * 
 * @example
 * ```typescript
 * normalizeSlug('  Melbourne  ')
 * // 'melbourne'
 * ```
 */
export function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}
