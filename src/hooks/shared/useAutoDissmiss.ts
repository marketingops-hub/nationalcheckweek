import { useEffect, useRef } from 'react';

/**
 * Auto-dismiss hook for temporary UI states.
 * 
 * Automatically calls a callback after a specified duration.
 * Useful for auto-dismissing success/error messages.
 * 
 * Features:
 * - Configurable duration
 * - Automatic cleanup
 * - Dependency tracking
 * - Prevents memory leaks
 * 
 * @param callback - Function to call after duration
 * @param duration - Duration in milliseconds (0 = disabled)
 * @param dependencies - Dependencies that trigger reset
 * 
 * @example
 * ```tsx
 * const [showSuccess, setShowSuccess] = useState(false);
 * 
 * // Auto-dismiss after 5 seconds
 * useAutoDismiss(
 *   () => setShowSuccess(false),
 *   5000,
 *   [showSuccess]
 * );
 * ```
 */
export function useAutoDismiss(
  callback: () => void,
  duration: number,
  dependencies: any[] = []
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Don't set timeout if duration is 0 or callback is not provided
    if (duration <= 0 || !callback) {
      return;
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      callback();
      timeoutRef.current = null;
    }, duration);

    // Cleanup on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [callback, duration, ...dependencies]);
}
