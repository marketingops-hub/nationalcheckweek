/**
 * Comprehensive error types for AI services
 */

export interface AIErrorDetails {
  provider?: 'openai' | 'anthropic';
  model?: string;
  statusCode?: number;
  retryAfter?: number;
  originalError?: unknown;
  context?: Record<string, unknown>;
}

/**
 * Base class for all AI-related errors
 */
export class AIError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: AIErrorDetails
  ) {
    super(message);
    this.name = 'AIError';
    Object.setPrototypeOf(this, AIError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

/**
 * OpenAI-specific errors
 */
export class OpenAIError extends AIError {
  constructor(
    message: string,
    code: string,
    details?: AIErrorDetails
  ) {
    super(message, code, { ...details, provider: 'openai' });
    this.name = 'OpenAIError';
    Object.setPrototypeOf(this, OpenAIError.prototype);
  }

  static fromAPIError(err: unknown): OpenAIError {
    if (err && typeof err === 'object' && 'status' in err) {
      const apiError = err as { status?: number; message?: string; code?: string };
      
      switch (apiError.status) {
        case 429:
          return new OpenAIError(
            'Rate limit exceeded',
            'RATE_LIMIT',
            { statusCode: 429, originalError: err }
          );
        case 401:
          return new OpenAIError(
            'Invalid API key',
            'INVALID_API_KEY',
            { statusCode: 401, originalError: err }
          );
        case 400:
          return new OpenAIError(
            'Invalid request',
            'INVALID_REQUEST',
            { statusCode: 400, originalError: err }
          );
        case 500:
        case 502:
        case 503:
        case 504:
          return new OpenAIError(
            'OpenAI service error',
            'API_ERROR',
            { statusCode: apiError.status, originalError: err }
          );
        default:
          return new OpenAIError(
            apiError.message || 'Unknown OpenAI error',
            'UNKNOWN_ERROR',
            { statusCode: apiError.status, originalError: err }
          );
      }
    }

    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return new OpenAIError('Request timeout', 'TIMEOUT', { originalError: err });
      }
      return new OpenAIError(err.message, 'UNKNOWN_ERROR', { originalError: err });
    }

    return new OpenAIError('Unknown error', 'UNKNOWN_ERROR', { originalError: err });
  }
}

/**
 * Anthropic-specific errors
 */
export class AnthropicError extends AIError {
  constructor(
    message: string,
    code: string,
    details?: AIErrorDetails
  ) {
    super(message, code, { ...details, provider: 'anthropic' });
    this.name = 'AnthropicError';
    Object.setPrototypeOf(this, AnthropicError.prototype);
  }

  static fromAPIError(err: unknown): AnthropicError {
    if (err && typeof err === 'object' && 'status' in err) {
      const apiError = err as { status?: number; message?: string; error?: { type?: string } };
      
      switch (apiError.status) {
        case 429:
          return new AnthropicError(
            'Rate limit exceeded',
            'RATE_LIMIT',
            { statusCode: 429, originalError: err }
          );
        case 401:
          return new AnthropicError(
            'Invalid API key',
            'INVALID_API_KEY',
            { statusCode: 401, originalError: err }
          );
        case 400:
          return new AnthropicError(
            'Invalid request',
            'INVALID_REQUEST',
            { statusCode: 400, originalError: err }
          );
        case 529:
          return new AnthropicError(
            'Service overloaded',
            'OVERLOADED',
            { statusCode: 529, originalError: err }
          );
        case 500:
        case 502:
        case 503:
        case 504:
          return new AnthropicError(
            'Anthropic service error',
            'API_ERROR',
            { statusCode: apiError.status, originalError: err }
          );
        default:
          return new AnthropicError(
            apiError.message || 'Unknown Anthropic error',
            'UNKNOWN_ERROR',
            { statusCode: apiError.status, originalError: err }
          );
      }
    }

    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return new AnthropicError('Request timeout', 'TIMEOUT', { originalError: err });
      }
      return new AnthropicError(err.message, 'UNKNOWN_ERROR', { originalError: err });
    }

    return new AnthropicError('Unknown error', 'UNKNOWN_ERROR', { originalError: err });
  }
}

/**
 * Error when both AI providers fail
 */
export class AIServiceError extends AIError {
  constructor(
    message: string,
    public primaryError: Error,
    public fallbackError: Error
  ) {
    super(message, 'BOTH_PROVIDERS_FAILED', {
      context: {
        primaryError: primaryError.message,
        fallbackError: fallbackError.message,
      }
    });
    this.name = 'AIServiceError';
    Object.setPrototypeOf(this, AIServiceError.prototype);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      primaryError: {
        message: this.primaryError.message,
        name: this.primaryError.name,
      },
      fallbackError: {
        message: this.fallbackError.message,
        name: this.fallbackError.name,
      },
    };
  }
}

/**
 * Validation error for invalid inputs
 */
export class ValidationError extends AIError {
  constructor(
    message: string,
    public validationErrors: Record<string, string[]>
  ) {
    super(message, 'VALIDATION_ERROR', {
      context: { validationErrors }
    });
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Check if an error should trigger fallback to alternative provider
 */
export function shouldFallbackToAnthropic(error: unknown): boolean {
  if (error instanceof OpenAIError) {
    return ['TIMEOUT', 'RATE_LIMIT', 'API_ERROR', 'NETWORK_ERROR'].includes(error.code);
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('timeout') || 
           msg.includes('rate limit') || 
           msg.includes('429') ||
           msg.includes('503') || 
           msg.includes('504');
  }

  return false;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AIError) {
    return ['TIMEOUT', 'RATE_LIMIT', 'API_ERROR', 'NETWORK_ERROR', 'OVERLOADED'].includes(error.code);
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes('timeout') || 
           msg.includes('rate limit') || 
           msg.includes('503') || 
           msg.includes('504') ||
           msg.includes('network');
  }

  return false;
}
