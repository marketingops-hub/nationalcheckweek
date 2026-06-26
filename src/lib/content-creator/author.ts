/**
 * Format a `created_by` / `added_by` identifier into a friendly display name.
 *
 * Records store the creator as the staff member's email — the "person behind
 * the process" who hit Generate/Create, NOT the fictional author/voice the AI
 * writes in. Legacy and system-generated rows carry the literal 'admin'
 * default. This turns either form into a human label:
 *
 *   kathleen@lifeskillsgroup.com.au → "Kathleen"
 *   jane.doe@example.com            → "Jane Doe"
 *   admin                           → "Admin"
 *   (null / empty)                  → "Unknown"
 */
export function formatAuthor(value: string | null | undefined): string {
  if (!value) return 'Unknown';
  const v = value.trim();
  if (!v || v === 'admin') return 'Admin';
  const local = v.includes('@') ? v.split('@')[0] : v;
  return (
    local
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim() || 'Admin'
  );
}
