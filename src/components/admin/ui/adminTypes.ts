/**
 * Shared domain types for admin client components.
 * Import from here instead of re-declaring per file.
 */

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface AdminApiKey {
  id: string;
  label: string;
  provider: string;
  key_value: string;
  is_active: boolean;
  created_at: string;
}

export interface AdminRedirect {
  id: string;
  from_path: string;
  to_path: string;
  status_code: number;
  is_active: boolean;
  note: string;
  created_at: string;
}

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

/** Generic field-error map used by all form validators. */
export type FieldErrors = Record<string, string>;
