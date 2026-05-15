/**
 * Source management system - Barrel export
 * Import from '@/lib/sources' for automatic server/client detection
 */

export * from './types';
export * from './validation';

// Re-export server functions (will be tree-shaken in client bundles)
export {
  getSourcesForEntity,
  getAreaSources,
  getStateSources,
  getIssueSources,
  getResearchThemeSources,
  getContentSources,
  getAllSources,
  getAllSourceLinks,
  addSource,
  linkSourceToEntity,
  deleteSourceLink,
  addAndLinkSource,
} from './server';
