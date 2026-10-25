/* ═══════════════════════════════════════════════════════════════════════════
 * Vault — controlled category vocabulary.
 *
 * Categories are used as a human filter in the Vault library and as the
 * `category_filter` in semantic retrieval. This is the shared list of
 * SUGGESTED categories — surfaced as <datalist> options on the category
 * inputs — but users may type any custom category they need (the DB column
 * is free-text). Keeping common ones here just reduces accidental drift
 * ("stats" vs "statistics") without blocking new ones.
 * ═══════════════════════════════════════════════════════════════════════════ */

export const VAULT_CATEGORIES = [
  'general',
  'mental health',
  'education',
  'government',
  'research',
  'statistics',
  'programs',
  'brand guidelines',
  'other',
] as const;

export type VaultCategory = (typeof VAULT_CATEGORIES)[number];

export const DEFAULT_VAULT_CATEGORY: VaultCategory = 'general';

/**
 * Categories offered when uploading or editing a document. A short, fixed
 * list keeps the library tidy; documents already stored under an older
 * category keep it (the edit screen shows it as an extra option).
 */
export const UPLOAD_CATEGORIES = [
  { value: 'nciw', label: 'NCIW' },
  { value: 'general', label: 'General' },
] as const;

/** Preselected for new uploads. */
export const DEFAULT_UPLOAD_CATEGORY = 'nciw';
