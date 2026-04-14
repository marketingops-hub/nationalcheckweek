/**
 * Client-side source management operations
 * Use this in Client Components and client-side code
 */

import { createClient } from '@/lib/supabase/client';
import type { Source, SourceResult, AddSourceParams, LinkSourceParams, VaultSource, SourceLink } from './types';
import {
  validateUrl,
  validateTitle,
  validateEntityType,
  validateEntitySlug,
  validateRelevance,
  validateCategory,
  validateDescription,
  sanitizeString,
  normalizeSlug,
} from './validation';

/**
 * Fetch all sources from vault_sources (client-side)
 */
export async function getAllSources(): Promise<SourceResult<VaultSource[]>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('vault_sources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getAllSources] Database error:', error);
      return {
        data: [],
        error: `Failed to fetch sources: ${error.message}`,
      };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('[getAllSources] Unexpected error:', err);
    return {
      data: [],
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Get all source links with source details (client-side)
 */
export async function getAllSourceLinks(): Promise<SourceResult<(SourceLink & { source?: VaultSource })[]>> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('source_links')
      .select(`
        *,
        source:vault_sources(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getAllSourceLinks] Database error:', error);
      return {
        data: [],
        error: `Failed to fetch source links: ${error.message}`,
      };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('[getAllSourceLinks] Unexpected error:', err);
    return {
      data: [],
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Add a new source to vault_sources (client-side)
 */
export async function addSource(params: AddSourceParams): Promise<SourceResult<string>> {
  // Validate inputs
  const urlValidation = validateUrl(params.url);
  if (!urlValidation.isValid) {
    return { data: '', error: urlValidation.error };
  }

  const titleValidation = validateTitle(params.title);
  if (!titleValidation.isValid) {
    return { data: '', error: titleValidation.error };
  }

  const descValidation = validateDescription(params.description);
  if (!descValidation.isValid) {
    return { data: '', error: descValidation.error };
  }

  if (params.category) {
    const categoryValidation = validateCategory(params.category);
    if (!categoryValidation.isValid) {
      return { data: '', error: categoryValidation.error };
    }
  }

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('vault_sources')
      .insert({
        url: sanitizeString(params.url),
        title: sanitizeString(params.title),
        description: params.description ? sanitizeString(params.description) : '',
        category: params.category || 'general',
        is_approved: true,
        added_by: params.addedBy || 'admin',
      })
      .select('id')
      .single();

    if (error) {
      console.error('[addSource] Database error:', error);
      
      // Handle duplicate URL error
      if (error.code === '23505') {
        return { data: '', error: 'A source with this URL already exists' };
      }
      
      return {
        data: '',
        error: `Failed to add source: ${error.message}`,
      };
    }

    return { data: data?.id || '', error: null };
  } catch (err) {
    console.error('[addSource] Unexpected error:', err);
    return {
      data: '',
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Link a source to an entity (client-side)
 */
export async function linkSourceToEntity(params: LinkSourceParams): Promise<SourceResult<boolean>> {
  // Validate inputs
  if (!params.sourceId?.trim()) {
    return { data: false, error: 'Source ID is required' };
  }

  const typeValidation = validateEntityType(params.entityType);
  if (!typeValidation.isValid) {
    return { data: false, error: typeValidation.error };
  }

  const slugValidation = validateEntitySlug(params.entitySlug);
  if (!slugValidation.isValid) {
    return { data: false, error: slugValidation.error };
  }

  if (params.relevance) {
    const relevanceValidation = validateRelevance(params.relevance);
    if (!relevanceValidation.isValid) {
      return { data: false, error: relevanceValidation.error };
    }
  }

  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('source_links')
      .insert({
        source_id: params.sourceId,
        entity_type: normalizeSlug(params.entityType),
        entity_slug: normalizeSlug(params.entitySlug),
        relevance: params.relevance || 'primary',
        notes: params.notes ? sanitizeString(params.notes) : '',
      });

    if (error) {
      console.error('[linkSourceToEntity] Database error:', error);
      
      // Handle duplicate link error
      if (error.code === '23505') {
        return { data: false, error: 'This source is already linked to this entity' };
      }
      
      return {
        data: false,
        error: `Failed to link source: ${error.message}`,
      };
    }

    return { data: true, error: null };
  } catch (err) {
    console.error('[linkSourceToEntity] Unexpected error:', err);
    return {
      data: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Delete a source link (client-side)
 */
export async function deleteSourceLink(linkId: string): Promise<SourceResult<boolean>> {
  if (!linkId?.trim()) {
    return { data: false, error: 'Link ID is required' };
  }

  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('source_links')
      .delete()
      .eq('id', linkId);

    if (error) {
      console.error('[deleteSourceLink] Database error:', error);
      return {
        data: false,
        error: `Failed to delete link: ${error.message}`,
      };
    }

    return { data: true, error: null };
  } catch (err) {
    console.error('[deleteSourceLink] Unexpected error:', err);
    return {
      data: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Add a source and link it to an entity in one operation (client-side)
 */
export async function addAndLinkSource(
  sourceParams: AddSourceParams,
  linkParams: Omit<LinkSourceParams, 'sourceId'>
): Promise<SourceResult<boolean>> {
  const sourceResult = await addSource(sourceParams);

  if (sourceResult.error || !sourceResult.data) {
    return { data: false, error: sourceResult.error || 'Failed to add source' };
  }

  const linkResult = await linkSourceToEntity({
    ...linkParams,
    sourceId: sourceResult.data,
  });

  return linkResult;
}
