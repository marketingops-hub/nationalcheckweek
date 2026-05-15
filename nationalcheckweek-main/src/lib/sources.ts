// Helper functions to fetch sources for any entity type
import { createClient } from '@/lib/supabase/client';

export interface Source {
  source_id: string;
  url: string;
  title: string;
  description: string;
  domain: string;
  category: string;
  relevance: 'primary' | 'secondary' | 'reference';
  link_notes: string;
  linked_at: string;
}

/**
 * Fetch all sources linked to a specific entity
 * @param entityType - 'area', 'state', 'issue', 'content', 'research_theme'
 * @param entitySlug - The slug identifier (e.g., 'melbourne', 'victoria')
 * @returns Array of sources linked to this entity
 */
export async function getSourcesForEntity(
  entityType: string,
  entitySlug: string
): Promise<Source[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('entity_sources')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_slug', entitySlug)
    .order('relevance', { ascending: true }); // primary first
  
  if (error) {
    console.error('Error fetching sources:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Fetch sources for an area (city/region)
 * Examples: 'melbourne', 'sydney', 'brisbane', 'perth', 'adelaide', etc.
 */
export async function getAreaSources(areaSlug: string): Promise<Source[]> {
  return getSourcesForEntity('area', areaSlug);
}

/**
 * Fetch sources for a state
 * Examples: 'victoria', 'new-south-wales', 'queensland', 'western-australia', etc.
 */
export async function getStateSources(stateSlug: string): Promise<Source[]> {
  return getSourcesForEntity('state', stateSlug);
}

/**
 * Fetch sources for an issue
 * Examples: 'cyberbullying', 'anxiety', 'depression', 'school-refusal', etc.
 */
export async function getIssueSources(issueSlug: string): Promise<Source[]> {
  return getSourcesForEntity('issue', issueSlug);
}

/**
 * Fetch sources for a research theme
 * Examples: 'mental-health', 'wellbeing', 'attendance', etc.
 */
export async function getResearchThemeSources(themeSlug: string): Promise<Source[]> {
  return getSourcesForEntity('research_theme', themeSlug);
}

/**
 * Fetch sources for content blocks
 * Examples: 'hero-stats', 'about-section', etc.
 */
export async function getContentSources(contentSlug: string): Promise<Source[]> {
  return getSourcesForEntity('content', contentSlug);
}

/**
 * Fetch sources for any custom entity type
 * Examples: 'school', 'program', 'event', etc.
 */
export async function getCustomEntitySources(entityType: string, entitySlug: string): Promise<Source[]> {
  return getSourcesForEntity(entityType, entitySlug);
}

/**
 * Link a source to an entity
 */
export async function linkSourceToEntity(
  sourceId: string,
  entityType: string,
  entitySlug: string,
  relevance: 'primary' | 'secondary' | 'reference' = 'primary',
  notes: string = ''
): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('source_links')
    .insert({
      source_id: sourceId,
      entity_type: entityType,
      entity_slug: entitySlug,
      relevance,
      notes
    });
  
  if (error) {
    console.error('Error linking source:', error);
    return false;
  }
  
  return true;
}

/**
 * Add a new source to vault_sources
 */
export async function addSource(
  url: string,
  title: string,
  description: string,
  category: string = 'general'
): Promise<string | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('vault_sources')
    .insert({
      url,
      title,
      description,
      category,
      is_approved: true,
      added_by: 'admin'
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Error adding source:', error);
    return null;
  }
  
  return data?.id || null;
}

/**
 * Add a source and link it to an entity in one operation
 */
export async function addAndLinkSource(
  url: string,
  title: string,
  description: string,
  entityType: string,
  entitySlug: string,
  category: string = 'general',
  relevance: 'primary' | 'secondary' | 'reference' = 'primary',
  notes: string = ''
): Promise<boolean> {
  const sourceId = await addSource(url, title, description, category);
  
  if (!sourceId) {
    return false;
  }
  
  return await linkSourceToEntity(sourceId, entityType, entitySlug, relevance, notes);
}
