/* ═══════════════════════════════════════════════════════════════════════════
 * Vault — controlled category vocabulary.
 *
 * Categories are used both as a human filter in the Vault library and as the
 * `category_filter` in semantic retrieval, so freeform values ("stats" vs
 * "statistics") silently fragment search. This is the single source of truth;
 * every add/edit surface should offer exactly these options.
 *
 * Add new categories here, not inline in a component. Existing rows with
 * legacy freeform values keep working — nothing is deleted; the list only
 * constrains new input.
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
