import { useState, useCallback } from 'react';

interface UseApiMutationOptions<TData, TVariables> {
  /** The mutation function to execute */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Optional success callback */
  onSuccess?: (data: TData) => void;
  /** Optional error callback */
  onError?: (error: Error) => void;
}

interface UseApiMutationResult<TData, TVariables> {
  /** Execute the mutation */
  mutate: (variables: TVariables) => Promise<void>;
  /** Mutation data */
  data: TData | null;
  /** Error if mutation failed */
  error: Error | null;
  /** Whether mutation is in progress */
  isLoading: boolean;
  /** Whether mutation succeeded */
  isSuccess: boolean;
  /** Whether mutation failed */
  isError: boolean;
  /** Reset mutation state */
  reset: () => void;
}

/**
 * Generic API mutation hook with loading and error states.
 * 
 * Provides a consistent pattern for API calls with automatic
 * state management for loading, success, and error states.
 * 
 * Features:
 * - Loading state management
 * - Error handling
 * - Success callbacks
 * - Type-safe
 * - Reset functionality
 * 
 * @example
 * ```tsx
 * const { mutate, isLoading, error } = useApiMutation({
 *   mutationFn: async (data) => {
 *     const res = await fetch('/api/sources', {
 *       method: 'POST',
 *       body: JSON.stringify(data),
 *     });
 *     return res.json();
 *   },
 *   onSuccess: () => {
 *     console.log('Success!');
 *   },
 * });
 * 
 * await mutate({ url: 'https://example.com' });
 * ```
 */
export function useApiMutation<TData = unknown, TVariables = void>({
  mutationFn,
  onSuccess,
  onError,
}: UseApiMutationOptions<TData, TVariables>): UseApiMutationResult<TData, TVariables> {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const mutate = useCallback(async (variables: TVariables) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    setIsError(false);

    try {
      const result = await mutationFn(variables);
      setData(result);
      setIsSuccess(true);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      setIsError(true);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setIsSuccess(false);
    setIsError(false);
  }, []);

  return {
    mutate,
    data,
    error,
    isLoading,
    isSuccess,
    isError,
    reset,
  };
}
