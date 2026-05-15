import { useState, useCallback } from "react";
import { getAllSourceLinks, linkSourceToEntity, deleteSourceLink } from "@/lib/sources/client";
import type { SourceLink, VaultSource, EntityType, Relevance } from "@/lib/sources/types";

/**
 * Custom hook for managing source links data and operations.
 * Handles fetching, creating, and deleting links between sources and entities.
 * 
 * @returns Object containing links data, loading state, and CRUD operations
 * 
 * @example
 * ```tsx
 * const { links, loading, error, success, fetchLinks, createLink, removeLink } = useSourceLinks();
 * 
 * useEffect(() => {
 *   fetchLinks();
 * }, []);
 * 
 * await createLink({ sourceId, entityType, entitySlug, relevance, notes });
 * await removeLink(linkId);
 * ```
 */
export function useSourceLinks() {
  const [links, setLinks] = useState<(SourceLink & { source?: VaultSource })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const result = await getAllSourceLinks();
    
    if (result.error) {
      setError(result.error);
    } else {
      setLinks(result.data);
    }
    
    setLoading(false);
  }, []);

  const createLink = useCallback(async (data: {
    sourceId: string;
    entityType: EntityType;
    entitySlug: string;
    relevance: Relevance;
    notes?: string;
  }) => {
    setError(null);
    setSuccess(null);
    
    const result = await linkSourceToEntity(data);
    
    if (result.error) {
      setError(result.error);
      return false;
    } else {
      setSuccess('Source linked successfully');
      await fetchLinks();
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
      
      return true;
    }
  }, [fetchLinks]);

  const removeLink = useCallback(async (id: string) => {
    setError(null);
    setSuccess(null);
    
    const result = await deleteSourceLink(id);
    
    if (result.error) {
      setError(result.error);
      return false;
    } else {
      setSuccess('Link deleted successfully');
      await fetchLinks();
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
      
      return true;
    }
  }, [fetchLinks]);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    links,
    loading,
    error,
    success,
    fetchLinks,
    createLink,
    removeLink,
    clearMessages,
  };
}
