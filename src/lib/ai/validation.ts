import { z } from 'zod';

/**
 * Validation schemas for AI service inputs
 */

export const GenerateOptionsSchema = z.object({
  systemPrompt: z.string().min(1, 'System prompt is required').max(10000, 'System prompt too long'),
  userPrompt: z.string().min(1, 'User prompt is required').max(50000, 'User prompt too long'),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4096).optional(),
  timeout: z.number().min(1000).max(120000).optional(),
});

export const GenerateJSONOptionsSchema = GenerateOptionsSchema.extend({
  schema: z.record(z.string(), z.unknown()).optional(),
});

export const EdgeFunctionRequestSchema = z.object({
  page_type: z.enum(['state', 'area', 'blog', 'issue']),
  record_id: z.string().uuid('Invalid record ID format'),
  section_keys: z.array(z.string()).min(1, 'At least one section required').max(10, 'Too many sections'),
});

export type ValidatedGenerateOptions = z.infer<typeof GenerateOptionsSchema>;
export type ValidatedGenerateJSONOptions = z.infer<typeof GenerateJSONOptionsSchema>;
export type ValidatedEdgeFunctionRequest = z.infer<typeof EdgeFunctionRequestSchema>;
