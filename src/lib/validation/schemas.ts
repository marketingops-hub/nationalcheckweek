import { z } from 'zod';

/**
 * Validation schemas for API endpoints
 * Using Zod for runtime type checking and validation
 */

// ============================================================================
// Blog Post Schemas
// ============================================================================

export const blogPostCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  excerpt: z.string().max(500, 'Excerpt too long').optional(),
  content: z.string().max(100000, 'Content too long').optional(),
  author: z.string().max(100, 'Author name too long').optional(),
  feature_image: z.string().url('Invalid image URL').optional().or(z.literal('')),
  published: z.boolean().default(false),
  meta_title: z.string().max(60, 'Meta title too long').optional(),
  meta_desc: z.string().max(160, 'Meta description too long').optional(),
  og_image: z.string().url('Invalid OG image URL').optional().or(z.literal('')),
});

export const blogPostUpdateSchema = blogPostCreateSchema.partial();

export type BlogPostCreate = z.infer<typeof blogPostCreateSchema>;
export type BlogPostUpdate = z.infer<typeof blogPostUpdateSchema>;

// ============================================================================
// Area Generation Schemas
// ============================================================================

export const areaGenerateSchema = z.object({
  name: z.string().min(1, 'Area name is required').max(100, 'Name too long'),
  state: z.string().min(1, 'State is required').max(50, 'State too long'),
  type: z.enum(['city', 'region', 'lga']).default('city'),
});

export type AreaGenerate = z.infer<typeof areaGenerateSchema>;

// ============================================================================
// Blog Generation Schemas
// ============================================================================

export const blogGenerateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  style: z.enum(['professional', 'conversational', 'academic', 'storytelling']).default('professional'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
});

export type BlogGenerate = z.infer<typeof blogGenerateSchema>;

// ============================================================================
// Source Management Schemas
// ============================================================================

export const sourceCreateSchema = z.object({
  url: z
    .string()
    .min(1, 'URL is required')
    .url('Must be a valid URL')
    .refine(
      (url) => {
        // Check for specific page (not just homepage)
        const urlObj = new URL(url);
        return urlObj.pathname !== '/' || urlObj.hash !== '';
      },
      { message: 'Please provide a specific page URL, not just the homepage' }
    ),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.enum(['mental_health', 'research', 'government', 'general']),
});

export const sourceLinkCreateSchema = z.object({
  sourceId: z.string().uuid('Invalid source ID'),
  entityType: z.enum(['area', 'state', 'issue', 'content', 'research_theme']),
  entitySlug: z.string().min(1, 'Entity slug is required'),
  relevance: z.enum(['primary', 'supporting', 'reference']),
  notes: z.string().max(500, 'Notes too long').optional(),
});

export type SourceCreate = z.infer<typeof sourceCreateSchema>;
export type SourceLinkCreate = z.infer<typeof sourceLinkCreateSchema>;

// ============================================================================
// API Key Schemas
// ============================================================================

export const apiKeyCreateSchema = z.object({
  label: z
    .string()
    .min(1, 'Label is required')
    .max(100, 'Label too long')
    .regex(/^[a-zA-Z0-9\s-_]+$/, 'Label can only contain letters, numbers, spaces, hyphens, and underscores'),
  provider: z.enum(['openai', 'anthropic', 'google', 'firecrawl', 'other']),
  keyValue: z
    .string()
    .min(8, 'API key seems too short - please check it')
    .max(500, 'API key too long')
    .refine((key) => !key.includes(' '), { message: 'API key should not contain spaces' }),
});

export type ApiKeyCreate = z.infer<typeof apiKeyCreateSchema>;

// ============================================================================
// Contact/Registration Schemas
// ============================================================================

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(254, 'Email too long');

export const registrationSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: emailSchema,
  school: z.string().min(1, 'School name is required').max(200, 'School name too long').optional(),
  role: z.string().max(100, 'Role too long').optional(),
  message: z.string().max(2000, 'Message too long').optional(),
});

export type Registration = z.infer<typeof registrationSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate data against a Zod schema
 * Returns validated data or throws with detailed error messages
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Validation failed: ${messages.join(', ')}`);
    }
    throw error;
  }
}

/**
 * Safely validate data, returning success/error result
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`);
      return { success: false, error: messages.join(', ') };
    }
    return { success: false, error: 'Validation failed' };
  }
}
