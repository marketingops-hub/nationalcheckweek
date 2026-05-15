import { describe, it, expect } from 'vitest';
import {
  AIError,
  OpenAIError,
  AnthropicError,
  AIServiceError,
  ValidationError,
  shouldFallbackToAnthropic,
  isRetryableError,
} from '../errors';

describe('AIError', () => {
  it('should create error with code and details', () => {
    const error = new AIError('Test error', 'TEST_CODE', { statusCode: 500 });
    
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.details?.statusCode).toBe(500);
    expect(error.name).toBe('AIError');
  });

  it('should serialize to JSON', () => {
    const error = new AIError('Test error', 'TEST_CODE', { statusCode: 500 });
    const json = error.toJSON();
    
    expect(json).toEqual({
      name: 'AIError',
      message: 'Test error',
      code: 'TEST_CODE',
      details: { statusCode: 500 },
    });
  });
});

describe('OpenAIError', () => {
  it('should create OpenAI-specific error', () => {
    const error = new OpenAIError('API error', 'API_ERROR', { statusCode: 500 });
    
    expect(error.message).toBe('API error');
    expect(error.code).toBe('API_ERROR');
    expect(error.details?.provider).toBe('openai');
    expect(error.name).toBe('OpenAIError');
  });

  it('should handle rate limit errors (429)', () => {
    const apiError = { status: 429, message: 'Rate limit exceeded' };
    const error = OpenAIError.fromAPIError(apiError);
    
    expect(error.code).toBe('RATE_LIMIT');
    expect(error.message).toBe('Rate limit exceeded');
    expect(error.details?.statusCode).toBe(429);
  });

  it('should handle invalid API key (401)', () => {
    const apiError = { status: 401, message: 'Invalid API key' };
    const error = OpenAIError.fromAPIError(apiError);
    
    expect(error.code).toBe('INVALID_API_KEY');
    expect(error.details?.statusCode).toBe(401);
  });

  it('should handle invalid request (400)', () => {
    const apiError = { status: 400, message: 'Bad request' };
    const error = OpenAIError.fromAPIError(apiError);
    
    expect(error.code).toBe('INVALID_REQUEST');
    expect(error.details?.statusCode).toBe(400);
  });

  it('should handle server errors (500-504)', () => {
    const statuses = [500, 502, 503, 504];
    
    statuses.forEach(status => {
      const apiError = { status, message: 'Server error' };
      const error = OpenAIError.fromAPIError(apiError);
      
      expect(error.code).toBe('API_ERROR');
      expect(error.details?.statusCode).toBe(status);
    });
  });

  it('should handle timeout errors', () => {
    const timeoutError = new Error('Timeout');
    timeoutError.name = 'AbortError';
    
    const error = OpenAIError.fromAPIError(timeoutError);
    
    expect(error.code).toBe('TIMEOUT');
    expect(error.message).toBe('Request timeout');
  });

  it('should handle unknown errors', () => {
    const unknownError = new Error('Something went wrong');
    const error = OpenAIError.fromAPIError(unknownError);
    
    expect(error.code).toBe('UNKNOWN_ERROR');
    expect(error.message).toBe('Something went wrong');
  });
});

describe('AnthropicError', () => {
  it('should create Anthropic-specific error', () => {
    const error = new AnthropicError('API error', 'API_ERROR', { statusCode: 500 });
    
    expect(error.message).toBe('API error');
    expect(error.code).toBe('API_ERROR');
    expect(error.details?.provider).toBe('anthropic');
    expect(error.name).toBe('AnthropicError');
  });

  it('should handle rate limit errors (429)', () => {
    const apiError = { status: 429, message: 'Rate limit exceeded' };
    const error = AnthropicError.fromAPIError(apiError);
    
    expect(error.code).toBe('RATE_LIMIT');
    expect(error.details?.statusCode).toBe(429);
  });

  it('should handle overloaded errors (529)', () => {
    const apiError = { status: 529, message: 'Service overloaded' };
    const error = AnthropicError.fromAPIError(apiError);
    
    expect(error.code).toBe('OVERLOADED');
    expect(error.details?.statusCode).toBe(529);
  });

  it('should handle timeout errors', () => {
    const timeoutError = new Error('Timeout');
    timeoutError.name = 'AbortError';
    
    const error = AnthropicError.fromAPIError(timeoutError);
    
    expect(error.code).toBe('TIMEOUT');
  });
});

describe('AIServiceError', () => {
  it('should create error with both provider errors', () => {
    const primaryError = new OpenAIError('OpenAI failed', 'RATE_LIMIT');
    const fallbackError = new AnthropicError('Anthropic failed', 'TIMEOUT');
    
    const error = new AIServiceError(
      'Both providers failed',
      primaryError,
      fallbackError
    );
    
    expect(error.message).toBe('Both providers failed');
    expect(error.code).toBe('BOTH_PROVIDERS_FAILED');
    expect(error.primaryError).toBe(primaryError);
    expect(error.fallbackError).toBe(fallbackError);
  });

  it('should serialize to JSON with both errors', () => {
    const primaryError = new Error('Primary failed');
    const fallbackError = new Error('Fallback failed');
    
    const error = new AIServiceError(
      'Both failed',
      primaryError,
      fallbackError
    );
    
    const json = error.toJSON();
    
    expect(json.primaryError).toEqual({
      message: 'Primary failed',
      name: 'Error',
    });
    expect(json.fallbackError).toEqual({
      message: 'Fallback failed',
      name: 'Error',
    });
  });
});

describe('ValidationError', () => {
  it('should create validation error with field errors', () => {
    const validationErrors = {
      systemPrompt: ['Required field'],
      temperature: ['Must be between 0 and 2'],
    };
    
    const error = new ValidationError('Validation failed', validationErrors);
    
    expect(error.message).toBe('Validation failed');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.validationErrors).toEqual(validationErrors);
  });
});

describe('shouldFallbackToAnthropic', () => {
  it('should return true for OpenAI rate limit errors', () => {
    const error = new OpenAIError('Rate limit', 'RATE_LIMIT');
    expect(shouldFallbackToAnthropic(error)).toBe(true);
  });

  it('should return true for OpenAI timeout errors', () => {
    const error = new OpenAIError('Timeout', 'TIMEOUT');
    expect(shouldFallbackToAnthropic(error)).toBe(true);
  });

  it('should return true for OpenAI API errors', () => {
    const error = new OpenAIError('API error', 'API_ERROR');
    expect(shouldFallbackToAnthropic(error)).toBe(true);
  });

  it('should return false for OpenAI validation errors', () => {
    const error = new OpenAIError('Invalid input', 'INVALID_REQUEST');
    expect(shouldFallbackToAnthropic(error)).toBe(false);
  });

  it('should return true for generic timeout errors', () => {
    const error = new Error('Request timeout');
    expect(shouldFallbackToAnthropic(error)).toBe(true);
  });

  it('should return true for rate limit messages', () => {
    const error = new Error('Rate limit exceeded');
    expect(shouldFallbackToAnthropic(error)).toBe(true);
  });

  it('should return true for 503 errors', () => {
    const error = new Error('503 Service Unavailable');
    expect(shouldFallbackToAnthropic(error)).toBe(true);
  });

  it('should return false for unknown errors', () => {
    const error = new Error('Unknown error');
    expect(shouldFallbackToAnthropic(error)).toBe(false);
  });
});

describe('isRetryableError', () => {
  it('should return true for timeout errors', () => {
    const error = new OpenAIError('Timeout', 'TIMEOUT');
    expect(isRetryableError(error)).toBe(true);
  });

  it('should return true for rate limit errors', () => {
    const error = new AnthropicError('Rate limit', 'RATE_LIMIT');
    expect(isRetryableError(error)).toBe(true);
  });

  it('should return true for overloaded errors', () => {
    const error = new AnthropicError('Overloaded', 'OVERLOADED');
    expect(isRetryableError(error)).toBe(true);
  });

  it('should return false for invalid request errors', () => {
    const error = new OpenAIError('Invalid', 'INVALID_REQUEST');
    expect(isRetryableError(error)).toBe(false);
  });

  it('should return true for network errors', () => {
    const error = new Error('Network error occurred');
    expect(isRetryableError(error)).toBe(true);
  });

  it('should return false for non-retryable errors', () => {
    const error = new Error('Invalid API key');
    expect(isRetryableError(error)).toBe(false);
  });
});
