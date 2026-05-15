import { useState, useCallback } from "react";
import { getAllSources, addSource } from "@/lib/sources/client";
import type { VaultSource, SourceCategory } from "@/lib/sources/types";

/**
 * Custom hook for managing sources data and operations.
 * Handles fetching, adding, and state management for vault sources.
 * 
 * @returns Object containing sources data, loading state, and CRUD operations
 * 
 * @example
 * ```tsx
 * const { sources, loading, error, success, fetchSources, createSource } = useSources();
 * 
 * useEffect(() => {
 *   fetchSources();
 * }, []);
 * 
 * await createSource({ url, title, description, category });
 * ```
 */
export function useSources() {
  const [sources, setSources] = useState<VaultSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const result = await getAllSources();
    
    if (result.error) {
      setError(result.error);
    } else {
      setSources(result.data);
    }
    
    setLoading(false);
  }, []);

  const createSource = useCallback(async (data: {
    url: string;
    title: string;
    description: string;
    category: SourceCategory;
  }) => {
    setError(null);
    setSuccess(null);
    
    const result = await addSource({
      ...data,
      addedBy: 'admin'
    });
    
    if (result.error) {
      setError(result.error);
      return false;
    } else {
      setSuccess('Source added successfully');
      await fetchSources();
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
      
      return true;
    }
  }, [fetchSources]);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    sources,
    loading,
    error,
    success,
    fetchSources,
    createSource,
    clearMessages,
  };
}
