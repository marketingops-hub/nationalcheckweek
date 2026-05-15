import { describe, it, expect } from 'vitest';
import {
  GenerateOptionsSchema,
  GenerateJSONOptionsSchema,
  EdgeFunctionRequestSchema,
} from '../validation';

describe('GenerateOptionsSchema', () => {
  it('should validate valid options', () => {
    const validOptions = {
      systemPrompt: 'You are a helpful assistant',
      userPrompt: 'Write a blog post',
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 2000,
      timeout: 30000,
    };

    const result = GenerateOptionsSchema.safeParse(validOptions);
    expect(result.success).toBe(true);
  });

  it('should validate minimal options', () => {
    const minimalOptions = {
      systemPrompt: 'Test',
      userPrompt: 'Test',
    };

    const result = GenerateOptionsSchema.safeParse(minimalOptions);
    expect(result.success).toBe(true);
  });

  it('should reject empty system prompt', () => {
    const invalidOptions = {
      systemPrompt: '',
      userPrompt: 'Test',
    };

    const result = GenerateOptionsSchema.safeParse(invalidOptions);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('System prompt is required');
    }
  });

  it('should reject empty user prompt', () => {
    const invalidOptions = {
      systemPrompt: 'Test',
      userPrompt: '',
    };

    const result = GenerateOptionsSchema.safeParse(invalidOptions);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('User prompt is required');
    }
  });

  it('should reject system prompt that is too long', () => {
    const invalidOptions = {
      systemPrompt: 'a'.repeat(10001),
      userPrompt: 'Test',
    };

    const result = GenerateOptionsSchema.safeParse(invalidOptions);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('too long');
    }
  });

  it('should reject user prompt that is too long', () => {
    const invalidOptions = {
      systemPrompt: 'Test',
      userPrompt: 'a'.repeat(50001),
    };

    const result = GenerateOptionsSchema.safeParse(invalidOptions);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('too long');
    }
  });

  it('should reject temperature below 0', () => {
    const invalidOptions = {
      systemPrompt: 'Test',
      userPrompt: 'Test',
      temperature: -0.1,
    };

    const result = GenerateOptionsSchema.safeParse(invalidOptions);
    expect(result.success).toBe(false);
  });

  it('should reject temperature above 2', () => {
    const invalidOptions = {
      systemPrompt: 'Test',
      userPrompt: 'Test',
      temperature: 2.1,
    };

    const result = GenerateOptionsSchema.safeParse(invalidOptions);
    expect(result.success).toBe(false);
  });

  it('should reject maxTokens below 1', () => {
    const invalidOptions = {
      systemPrompt: 'Test',
      userPrompt: 'Test',
      maxTokens: 0,
    };

    const result = GenerateOptionsSchema.safeParse(invalidOptions);
    expect(result.success).toBe(false);
  });

  it('should reject maxTokens above 4096', () => {
    const invalidOptions = {
      systemPrompt: 'Test',
      userPrompt: 'Test',
      maxTokens: 5000,
    };

    const result = GenerateOptionsSchema.safeParse(invalidOptions);
    expect(result.success).toBe(false);
  });

  it('should reject timeout below 1000ms', () => {
    const invalidOptions = {
      systemPrompt: 'Test',
      userPrompt: 'Test',
      timeout: 500,
    };

    const result = GenerateOptionsSchema.safeParse(invalidOptions);
    expect(result.success).toBe(false);
  });

  it('should reject timeout above 120000ms', () => {
    const invalidOptions = {
      systemPrompt: 'Test',
      userPrompt: 'Test',
      timeout: 150000,
    };

    const result = GenerateOptionsSchema.safeParse(invalidOptions);
    expect(result.success).toBe(false);
  });
});

describe('GenerateJSONOptionsSchema', () => {
  it('should validate JSON options with schema', () => {
    const validOptions = {
      systemPrompt: 'Generate JSON',
      userPrompt: 'Create user data',
      schema: {
        name: 'string',
        age: 'number',
      },
    };

    const result = GenerateJSONOptionsSchema.safeParse(validOptions);
    expect(result.success).toBe(true);
  });

  it('should validate JSON options without schema', () => {
    const validOptions = {
      systemPrompt: 'Generate JSON',
      userPrompt: 'Create user data',
    };

    const result = GenerateJSONOptionsSchema.safeParse(validOptions);
    expect(result.success).toBe(true);
  });
});

describe('EdgeFunctionRequestSchema', () => {
  it('should validate valid edge function request', () => {
    const validRequest = {
      page_type: 'state',
      record_id: '123e4567-e89b-12d3-a456-426614174000',
      section_keys: ['subtitle', 'issues'],
    };

    const result = EdgeFunctionRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it('should validate all page types', () => {
    const pageTypes = ['state', 'area', 'blog', 'issue'] as const;

    pageTypes.forEach(pageType => {
      const request = {
        page_type: pageType,
        record_id: '123e4567-e89b-12d3-a456-426614174000',
        section_keys: ['test'],
      };

      const result = EdgeFunctionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid page type', () => {
    const invalidRequest = {
      page_type: 'invalid',
      record_id: '123e4567-e89b-12d3-a456-426614174000',
      section_keys: ['test'],
    };

    const result = EdgeFunctionRequestSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
  });

  it('should reject invalid UUID format', () => {
    const invalidRequest = {
      page_type: 'state',
      record_id: 'not-a-uuid',
      section_keys: ['test'],
    };

    const result = EdgeFunctionRequestSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Invalid record ID format');
    }
  });

  it('should reject empty section_keys array', () => {
    const invalidRequest = {
      page_type: 'state',
      record_id: '123e4567-e89b-12d3-a456-426614174000',
      section_keys: [],
    };

    const result = EdgeFunctionRequestSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('At least one section required');
    }
  });

  it('should reject too many sections', () => {
    const invalidRequest = {
      page_type: 'state',
      record_id: '123e4567-e89b-12d3-a456-426614174000',
      section_keys: Array(11).fill('section'),
    };

    const result = EdgeFunctionRequestSchema.safeParse(invalidRequest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Too many sections');
    }
  });

  it('should accept maximum allowed sections', () => {
    const validRequest = {
      page_type: 'state',
      record_id: '123e4567-e89b-12d3-a456-426614174000',
      section_keys: Array(10).fill('section'),
    };

    const result = EdgeFunctionRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });
});
