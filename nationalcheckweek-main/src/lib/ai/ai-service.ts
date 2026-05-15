import { openaiService } from './openai-service';
import { anthropicService } from './anthropic-service';
import { OpenAIError, AnthropicError, AIServiceError, shouldFallbackToAnthropic } from './errors';

/**
 * Unified AI generation options
 */
export interface AIGenerateOptions {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  responseFormat?: 'text' | 'json';
}

/**
 * Unified AI generation result
 */
export interface AIGenerateResult {
  content: string;
  provider: 'openai' | 'anthropic';
  fallbackUsed: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, unknown>;
}


/**
 * Unified AI Service
 * 
 * Provides a single interface for AI content generation with automatic fallback
 * from OpenAI to Anthropic Claude on errors.
 * 
 * @example
 * ```typescript
 * const result = await aiService.generateContent({
 *   systemPrompt: 'You are a helpful assistant',
 *   userPrompt: 'Write a blog post about AI',
 *   model: 'gpt-4o',
 *   temperature: 0.7
 * });
 * 
 * console.log(result.content); // Generated content
 * console.log(result.provider); // 'openai' or 'anthropic'
 * console.log(result.fallbackUsed); // true if fallback was used
 * ```
 */
export class AIService {
  /**
   * Generate content with automatic fallback
   * 
   * Tries OpenAI first, automatically falls back to Anthropic on:
   * - Rate limit errors (429)
   * - Timeout errors (504)
   * - Server errors (500, 503)
   * - Network failures
   * 
   * @param options - Generation options
   * @returns Generated content with provider info
   * @throws AIServiceError if both providers fail
   */
  async generateContent(options: AIGenerateOptions): Promise<AIGenerateResult> {
    const {
      systemPrompt,
      userPrompt,
      model = 'gpt-4o',
      temperature = 0.7,
      maxTokens = 4000,
      timeout = 60000,
    } = options;

    let primaryError: Error | null = null;
    let fallbackError: Error | null = null;

    // Try OpenAI first
    try {
      // Attempt OpenAI generation
      
      const result = await openaiService.generateContent(
        systemPrompt,
        userPrompt,
        {
          model,
          temperature,
          maxTokens,
          timeout,
        }
      );

      return {
        content: result.content,
        provider: 'openai',
        fallbackUsed: false,
        usage: result.usage,
        metadata: result.metadata,
      };
    } catch (err) {
      primaryError = err instanceof Error ? err : new Error(String(err));
      
      // Check if we should fallback
      if (!shouldFallbackToAnthropic(err)) {
        throw primaryError;
      }
    }

    // Fallback to Anthropic
    try {
      const result = await anthropicService.generateContent(
        systemPrompt,
        userPrompt,
        {
          model,
          temperature,
          maxTokens,
          timeout,
        }
      );

      return {
        content: result.content,
        provider: 'anthropic',
        fallbackUsed: true,
        usage: result.usage,
        metadata: result.metadata,
      };
    } catch (fallbackErr) {
      fallbackError = fallbackErr instanceof Error ? fallbackErr : new Error(String(fallbackErr));

      // Both providers failed
      throw new AIServiceError(
        'Content generation failed with both OpenAI and Anthropic',
        primaryError!,
        fallbackError
      );
    }
  }

  /**
   * Generate JSON content with automatic parsing and validation
   * 
   * @param options - Generation options
   * @returns Parsed JSON object
   * @throws AIServiceError if generation fails or JSON is invalid
   */
  async generateJSON<T = unknown>(options: AIGenerateOptions): Promise<{
    data: T;
    provider: 'openai' | 'anthropic';
    fallbackUsed: boolean;
  }> {
    const result = await this.generateContent({
      ...options,
      responseFormat: 'json',
    });

    try {
      // Clean potential markdown code fences
      const cleaned = result.content
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();

      const data = JSON.parse(cleaned) as T;

      return {
        data,
        provider: result.provider,
        fallbackUsed: result.fallbackUsed,
      };
    } catch (parseError) {
      const error = parseError instanceof Error ? parseError : new Error(String(parseError));
      throw new AIServiceError(
        'Failed to parse JSON response from AI',
        error,
        error
      );
    }
  }

  /**
   * Generate content with retry logic
   * 
   * @param options - Generation options
   * @param maxRetries - Maximum number of retries (default: 2)
   * @returns Generated content
   */
  async generateWithRetry(
    options: AIGenerateOptions,
    maxRetries: number = 2
  ): Promise<AIGenerateResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateContent(options);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          console.log(`[AI Service] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}

/**
 * Singleton instance of unified AI service
 */
export const aiService = new AIService();
