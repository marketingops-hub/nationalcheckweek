import { createClient } from './supabase/client';

/**
 * Error thrown when admin API requests fail
 */
export class AdminFetchError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AdminFetchError';
  }
}

/**
 * Options for adminFetch
 */
export interface AdminFetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Fetch wrapper that automatically includes admin authentication
 * 
 * Features:
 * - Automatic authentication with Supabase session token
 * - Timeout support (default 30s)
 * - Retry logic for transient failures (default 2 retries)
 * - Detailed error messages with context
 * - Type-safe response handling
 * 
 * @param url - API endpoint to call
 * @param options - Fetch options with additional timeout/retry settings
 * @returns Fetch response
 * @throws AdminFetchError if request fails or user is not authenticated
 * 
 * @example
 * ```typescript
 * const response = await adminFetch('/api/admin/blog', {
 *   method: 'POST',
 *   body: JSON.stringify({ title: 'Hello' }),
 *   timeout: 10000, // 10 seconds
 * });
 * const data = await response.json();
 * ```
 */
export async function adminFetch(
  url: string,
  options: AdminFetchOptions = {}
): Promise<Response> {
  const {
    timeout = 30000, // 30 seconds default
    retries = 2,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  // Get authentication token
  const supabase = createClient();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    throw new AdminFetchError(
      'Failed to get authentication session',
      401,
      url,
      sessionError
    );
  }
  
  if (!session?.access_token) {
    throw new AdminFetchError(
      'Not authenticated. Please log in to access admin features.',
      401,
      url
    );
  }

  // Add authorization header
  const headers = new Headers(fetchOptions.headers);
  headers.set('Authorization', `Bearer ${session.access_token}`);
  
  // Attempt request with retries
  let lastError: Error | null = null;
  
  // Only retry idempotent methods to prevent duplicate mutations
  const safeToRetry = ['GET', 'HEAD'].includes(options?.method?.toUpperCase() ?? 'GET');
  const effectiveRetries = safeToRetry ? retries : 0;

  for (let attempt = 0; attempt <= effectiveRetries; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new AdminFetchError(
            `Request to ${url} timed out after ${timeout}ms`,
            504,
            url
          ));
        }, timeout);
      });

      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(url, {
          ...fetchOptions,
          headers,
        }),
        timeoutPromise,
      ]);

      // Check for HTTP errors
      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorData = await response.clone().json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        throw new AdminFetchError(
          errorMessage,
          response.status,
          url
        );
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on client errors (4xx) or auth errors
      if (error instanceof AdminFetchError && error.statusCode < 500) {
        throw error;
      }

      // If this was the last effective attempt, throw the error. We use
      // `effectiveRetries` (not `retries`) so the message honours the fact
      // that non-idempotent methods are never retried.
      if (attempt === effectiveRetries) {
        break;
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
    }
  }

  // All retries failed
  throw new AdminFetchError(
    `Request to ${url} failed after ${effectiveRetries + 1} attempt${effectiveRetries === 0 ? '' : 's'}: ${lastError?.message}`,
    500,
    url,
    lastError
  );
}
