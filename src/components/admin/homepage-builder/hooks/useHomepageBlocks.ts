/**
 * Custom hook for managing homepage blocks
 * 
 * Provides state management and CRUD operations for homepage blocks.
 * Includes optimistic updates with automatic rollback on errors.
 * 
 * @returns {Object} Block state and operations
 * 
 * @example
 * ```tsx
 * const { blocks, loading, error, fetchBlocks, updateBlock, deleteBlock } = useHomepageBlocks();
 * ```
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { adminFetch } from "@/lib/adminFetch";
import type { HomepageBlock, BlockType, BlockContent } from "@/types/homepage-blocks";

interface UseHomepageBlocksReturn {
  blocks: HomepageBlock[];
  loading: boolean;
  error: string;
  success: string;
  fetchBlocks: () => Promise<void>;
  createBlock: (block_type: BlockType, title: string, content: BlockContent) => Promise<void>;
  updateBlockOrder: (blocks: HomepageBlock[]) => Promise<void>;
  toggleVisibility: (id: string, currentVisibility: boolean) => Promise<void>;
  saveBlock: (block: HomepageBlock) => Promise<void>;
  deleteBlock: (id: string, title: string) => Promise<void>;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

export function useHomepageBlocks(): UseHomepageBlocksReturn {
  const [blocks, setBlocks] = useState<HomepageBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const abortControllerRef = useRef<AbortController | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Show success message with auto-dismiss
   */
  const showSuccess = useCallback((message: string) => {
    setSuccess(message);
    setError("");
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    successTimeoutRef.current = setTimeout(() => setSuccess(""), 3000);
  }, []);

  /**
   * Show error message with auto-dismiss
   */
  const showError = useCallback((message: string) => {
    setError(message);
    setSuccess("");
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    errorTimeoutRef.current = setTimeout(() => setError(""), 5000);
  }, []);

  /**
   * Fetch all blocks from API
   */
  const fetchBlocks = useCallback(async () => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const res = await adminFetch("/api/admin/homepage-blocks", {
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setBlocks(data.blocks || []);
      setError("");
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('[useHomepageBlocks] Failed to fetch blocks:', err);
      showError(err instanceof Error ? err.message : "Failed to load blocks");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  /**
   * Create a new block
   */
  const createBlock = useCallback(async (block_type: BlockType, title: string, content: BlockContent) => {
    try {
      const res = await adminFetch("/api/admin/homepage-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ block_type, title, content, is_visible: true }),
      });
      const { block } = await res.json();
      setBlocks(prev => [...prev, block]);
      showSuccess(`"${title}" block added!`);
    } catch (err) {
      console.error('[useHomepageBlocks] Failed to create block:', err);
      showError(err instanceof Error ? err.message : "Failed to create block");
      throw err;
    }
  }, [showSuccess, showError]);

  /**
   * Update block order (for drag-and-drop)
   */
  const updateBlockOrder = useCallback(async (updatedBlocks: HomepageBlock[]) => {
    const previousBlocks = [...blocks];
    setBlocks(updatedBlocks);

    try {
      const res = await adminFetch("/api/admin/homepage-blocks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocks: updatedBlocks.map(b => ({ id: b.id, display_order: b.display_order })),
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to save order: ${res.statusText}`);
      }

      showSuccess("Block order updated!");
    } catch (err) {
      console.error('[useHomepageBlocks] Failed to save order:', err);
      setBlocks(previousBlocks);
      showError(err instanceof Error ? err.message : "Failed to save order");
    }
  }, [blocks, showSuccess, showError]);

  /**
   * Toggle block visibility
   */
  const toggleVisibility = useCallback(async (id: string, currentVisibility: boolean) => {
    const previousBlocks = [...blocks];
    setBlocks(blocks.map(b => b.id === id ? { ...b, is_visible: !currentVisibility } : b));

    try {
      const res = await adminFetch(`/api/admin/homepage-blocks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_visible: !currentVisibility }),
      });

      if (!res.ok) {
        throw new Error(`Failed to update visibility: ${res.statusText}`);
      }

      showSuccess(currentVisibility ? "Block hidden" : "Block visible");
    } catch (err) {
      console.error('[useHomepageBlocks] Failed to update visibility:', err);
      setBlocks(previousBlocks);
      showError(err instanceof Error ? err.message : "Failed to update visibility");
    }
  }, [blocks, showSuccess, showError]);

  /**
   * Save block content
   */
  const saveBlock = useCallback(async (block: HomepageBlock) => {
    console.log('[useHomepageBlocks] Saving block:', {
      id: block.id,
      title: block.title,
      content: block.content,
      colors: block.content.colors
    });
    
    try {
      const res = await adminFetch(`/api/admin/homepage-blocks/${block.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: block.content, 
          title: block.title 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const updatedBlock = await res.json();
      console.log('[useHomepageBlocks] Received updated block from API:', updatedBlock.block);
      
      setBlocks(prevBlocks => {
        const newBlocks = prevBlocks.map(b => b.id === block.id ? updatedBlock.block : b);
        console.log('[useHomepageBlocks] Updated blocks state:', newBlocks.find(b => b.id === block.id));
        return newBlocks;
      });
      
      showSuccess("Block saved successfully!");
    } catch (err) {
      console.error('[useHomepageBlocks] Failed to save block:', err);
      showError(err instanceof Error ? err.message : "Failed to save block");
      throw err;
    }
  }, [blocks, showSuccess, showError]);

  /**
   * Delete a block
   */
  const deleteBlock = useCallback(async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    const previousBlocks = [...blocks];
    setBlocks(blocks.filter(b => b.id !== id));

    try {
      const res = await adminFetch(`/api/admin/homepage-blocks/${id}`, { 
        method: "DELETE" 
      });

      if (!res.ok) {
        throw new Error(`Failed to delete block: ${res.statusText}`);
      }

      showSuccess("Block deleted successfully!");
    } catch (err) {
      console.error('[useHomepageBlocks] Failed to delete block:', err);
      setBlocks(previousBlocks);
      showError(err instanceof Error ? err.message : "Failed to delete block");
    }
  }, [blocks, showSuccess, showError]);

  // Initial fetch
  useEffect(() => {
    fetchBlocks();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [fetchBlocks]);

  return {
    blocks,
    loading,
    error,
    success,
    fetchBlocks,
    createBlock,
    updateBlockOrder,
    toggleVisibility,
    saveBlock,
    deleteBlock,
    showSuccess,
    showError,
  };
}
