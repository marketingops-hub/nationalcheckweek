/**
 * Shared types for source management system
 */

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

export interface VaultSource {
  id: string;
  url: string;
  title: string;
  description: string;
  domain: string;
  category: string;
  is_approved: boolean;
  added_by: string;
  created_at: string;
  updated_at: string;
}

export interface SourceLink {
  id: string;
  source_id: string;
  entity_type: EntityType;
  entity_slug: string;
  relevance: Relevance;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type EntityType = 'area' | 'state' | 'issue' | 'content' | 'research_theme';
export type Relevance = 'primary' | 'secondary' | 'reference';
export type SourceCategory = 'mental_health' | 'research' | 'government' | 'general';

export interface SourceResult<T> {
  data: T;
  error: string | null;
}

export interface AddSourceParams {
  url: string;
  title: string;
  description: string;
  category?: SourceCategory;
  addedBy?: string;
}

export interface LinkSourceParams {
  sourceId: string;
  entityType: EntityType;
  entitySlug: string;
  relevance?: Relevance;
  notes?: string;
}
