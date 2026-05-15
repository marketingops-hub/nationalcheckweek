/**
 * API Request Batching Utility
 * Batches multiple API requests to reduce network overhead
 * No 3rd party dependencies
 */

interface BatchRequest {
  id: string;
  url: string;
  options?: RequestInit;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

class ApiBatcher {
  private queue: BatchRequest[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private batchDelay: number;
  private maxBatchSize: number;

  constructor(batchDelay: number = 50, maxBatchSize: number = 10) {
    this.batchDelay = batchDelay;
    this.maxBatchSize = maxBatchSize;
  }

  /**
   * Add request to batch queue
   */
  async request<T>(url: string, options?: RequestInit): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = `${Date.now()}-${Math.random()}`;
      
      this.queue.push({
        id,
        url,
        options,
        resolve,
        reject,
      });

      // If batch is full, process immediately
      if (this.queue.length >= this.maxBatchSize) {
        this.processBatch();
      } else {
        // Otherwise, schedule batch processing
        this.scheduleBatch();
      }
    });
  }

  /**
   * Schedule batch processing
   */
  private scheduleBatch(): void {
    if (this.batchTimeout) {
      return;
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.batchDelay);
  }

  /**
   * Process all requests in the batch
   */
  private async processBatch(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.queue.length === 0) {
      return;
    }

    const batch = this.queue.splice(0, this.maxBatchSize);

    // Execute all requests in parallel
    const results = await Promise.allSettled(
      batch.map(req => fetch(req.url, req.options))
    );

    // Process results
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const request = batch[i];

      if (result.status === 'fulfilled') {
        try {
          const data = await result.value.json();
          request.resolve(data);
        } catch (error) {
          request.reject(error);
        }
      } else {
        request.reject(result.reason);
      }
    }
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    // Reject all pending requests
    for (const req of this.queue) {
      req.reject(new Error('Batch cleared'));
    }
    
    this.queue = [];
  }
}

// Singleton instance
const apiBatcher = new ApiBatcher(50, 10);

export default apiBatcher;

/**
 * Batch multiple GET requests
 */
export async function batchGet<T>(urls: string[]): Promise<T[]> {
  const promises = urls.map(url => apiBatcher.request<T>(url));
  return Promise.all(promises);
}

/**
 * Batch multiple requests with different methods
 */
export async function batchRequests<T>(
  requests: Array<{ url: string; options?: RequestInit }>
): Promise<T[]> {
  const promises = requests.map(req => 
    apiBatcher.request<T>(req.url, req.options)
  );
  return Promise.all(promises);
}

/**
 * Debounced API request - useful for search/autocomplete
 */
export function debouncedRequest<T>(
  url: string,
  options?: RequestInit,
  delay: number = 300
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(url, options);
        const data = await response.json();
        resolve(data);
      } catch (error) {
        reject(error);
      }
    }, delay);

    // Store timeout ID for potential cancellation
    (resolve as any).cancel = () => {
      clearTimeout(timeoutId);
      reject(new Error('Request cancelled'));
    };
  });
}
