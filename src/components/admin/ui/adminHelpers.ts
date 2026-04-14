/**
 * Shared utility helpers used across admin client components.
 */

/**
 * Formats a UTC date string into a human-readable locale string (en-AU).
 * Returns "Never" for null/undefined (e.g. last_sign_in_at).
 */
export function fmtDate(d: string | null | undefined): string {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formats a UTC date string with time component.
 */
export function fmtDateTime(d: string | null | undefined): string {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Extracts the bare hostname from a URL, stripping "www.".
 * Falls back to the raw string if the URL is invalid.
 */
export function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Masks an API key value for display, showing only the first 6 and last 4 characters.
 */
export function maskKey(k: string): string {
  if (k.length <= 8) return "••••••••";
  return k.slice(0, 6) + "••••••••••••••••" + k.slice(-4);
}

/**
 * Returns true if every value in a FieldErrors map is empty.
 */
export function hasNoErrors(errors: Record<string, string>): boolean {
  return Object.values(errors).every((v) => !v);
}

/**
 * Clears a single key from a field errors record (used in onChange handlers).
 */
export function clearFieldError(
  errors: Record<string, string>,
  key: string
): Record<string, string> {
  if (!errors[key]) return errors;
  return { ...errors, [key]: "" };
}
