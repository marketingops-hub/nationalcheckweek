/**
 * Custom hook for managing About page content
 * 
 * Provides state management and update handlers for the About page editor.
 * Eliminates code duplication by centralizing all update logic.
 * 
 * Features:
 * - Centralized state management
 * - Reusable update handlers for all content sections
 * - Dirty state tracking for unsaved changes detection
 * - Performance optimized with useCallback
 * 
 * @module useAboutContent
 */

'use client';

import { useState, useCallback } from 'react';
import type { AboutPageContent } from '@/types/cms/about';

type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

/**
 * Hook for managing About page content state and updates
 * 
 * @param initialContent - Initial content to populate the editor
 * @returns Object containing content state and update handlers
 * 
 * @example
 * ```tsx
 * const {
 *   content,
 *   isDirty,
 *   updateField,
 *   updateStat,
 *   updatePillar,
 *   updateBeliefItem,
 *   markClean,
 *   reset
 * } = useAboutContent(initialContent);
 * 
 * // Update a simple field
 * updateField('hero', 'title', 'New Title');
 * 
 * // Update a stat
 * updateStat('stat-1', { number: '2 in 5' });
 * 
 * // Check if there are unsaved changes
 * if (isDirty) {
 *   // Show warning
 * }
 * ```
 */
export function useAboutContent(initialContent: AboutPageContent) {
  const [content, setContent] = useState<AboutPageContent>(initialContent);
  const [isDirty, setIsDirty] = useState(false);

  /**
   * Update a simple field in a section (hero, mission, beliefs, cta)
   * 
   * @param section - The section to update (e.g., 'hero', 'mission')
   * @param field - The field within the section to update
   * @param value - The new value for the field
   */
  const updateField = useCallback(<S extends keyof AboutPageContent>(
    section: S,
    field: keyof AboutPageContent[S],
    value: string
  ) => {
    setContent(prev => {
      const sectionData = prev[section];
      if (typeof sectionData === 'object' && sectionData !== null) {
        return {
          ...prev,
          [section]: {
            ...sectionData,
            [field]: value
          }
        };
      }
      return prev;
    });
    setIsDirty(true);
  }, []);

  /**
   * Update a statistic item by its ID
   * 
   * @param id - The unique ID of the stat to update
   * @param updates - Partial updates to apply (number, label, or source)
   */
  const updateStat = useCallback((
    id: string,
    updates: Partial<{ number: string; label: string; source: string }>
  ) => {
    setContent(prev => ({
      ...prev,
      stats: prev.stats.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    }));
    setIsDirty(true);
  }, []);

  /**
   * Update a pillar item by its ID
   * 
   * @param id - The unique ID of the pillar to update
   * @param updates - Partial updates to apply (icon, title, or body)
   */
  const updatePillar = useCallback((
    id: string,
    updates: Partial<{ icon: string; title: string; body: string }>
  ) => {
    setContent(prev => ({
      ...prev,
      pillars: prev.pillars.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    }));
    setIsDirty(true);
  }, []);

  /**
   * Update a belief item by its ID
   * 
   * @param id - The unique ID of the belief to update
   * @param updates - Partial updates to apply (icon or text)
   */
  const updateBeliefItem = useCallback((
    id: string,
    updates: Partial<{ icon: string; text: string }>
  ) => {
    setContent(prev => ({
      ...prev,
      beliefs: {
        ...prev.beliefs,
        items: prev.beliefs.items.map(item =>
          item.id === id ? { ...item, ...updates } : item
        )
      }
    }));
    setIsDirty(true);
  }, []);

  /**
   * Mark content as clean (no unsaved changes)
   * Call this after successfully saving to the server
   */
  const markClean = useCallback(() => {
    setIsDirty(false);
  }, []);

  /**
   * Reset content to initial state and clear dirty flag
   * Useful for canceling edits
   */
  const reset = useCallback(() => {
    setContent(initialContent);
    setIsDirty(false);
  }, [initialContent]);

  return {
    content,
    isDirty,
    updateField,
    updateStat,
    updatePillar,
    updateBeliefItem,
    markClean,
    reset,
  };
}
