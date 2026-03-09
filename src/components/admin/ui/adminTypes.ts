/**
 * Shared TypeScript types used across admin client components.
 */

/** Row shape returned by the api_keys table. */
export interface AdminApiKey {
  id: string;
  label: string;
  provider: string;
  key_value: string;
  is_active: boolean;
  created_at: string;
}

/** Generic field-level validation errors keyed by field name. */
export type FieldErrors = Record<string, string>;

/** Row shape returned by the redirects table. */
export interface AdminRedirect {
  id: string;
  from_path: string;
  to_path: string;
  status_code: number;
  is_active: boolean;
  note: string;
  created_at: string;
}

/** User shape returned by Supabase auth admin. */
export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

/** Row shape returned by the vault_sources table. */
export interface AdminVaultSource {
  id: string;
  url: string;
  title: string;
  description: string;
  domain: string;
  category: string;
  is_approved: boolean;
  created_at: string;
}

/** Row shape returned by the issue_sources table. */
export interface IssueSource {
  id: string;
  issue_id: string;
  num: number;
  title: string;
  url: string;
  publisher: string;
  year: string;
  accessed_at: string;
  verified: boolean;
  created_at: string;
}

/** Row shape returned by the vault_content table. */
export interface AdminVaultContent {
  id: string;
  title: string;
  content: string;
  source: string;
  category: string;
  is_approved: boolean;
  created_at: string;
}

/** Row shape for a prompt template. */
export interface PromptTemplate {
  id: string;
  page_type: string;
  section_key: string;
  label: string;
  prompt: string;
  model: string;
  updated_at: string;
}
