/**
 * Builds a lowercase-title → slug lookup map from a list of issue rows.
 * Used by geo templates (states, areas, future geo×issue routes) to resolve
 * issue slugs from display titles stored in JSONB columns.
 */
export function buildIssueSlugMap(
  issues: { title: string; slug: string }[]
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of issues) {
    map[issue.title.toLowerCase()] = issue.slug;
  }
  return map;
}
