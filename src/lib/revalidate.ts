import { revalidatePath } from 'next/cache';

/**
 * Mapping of admin entity types to their public frontend paths.
 * When an entity is mutated via admin API, call `revalidateEntity()`
 * to bust the ISR cache so changes appear instantly.
 */

const ENTITY_PATHS: Record<string, string[]> = {
  blog:       ['/blog'],
  event:      ['/events'],
  faq:        ['/faq'],
  partner:    ['/partners'],
  resource:   ['/resources'],
  ambassador: ['/ambassadors'],
  page:       ['/'],             // CMS pages can affect any route
  homepage:   ['/'],
  settings:   ['/'],             // site settings affect layout/header/footer
};

/**
 * Revalidate ISR-cached frontend pages after an admin mutation.
 *
 * @param entity  - The entity type that was mutated (e.g. 'blog', 'event')
 * @param slug    - Optional slug to revalidate the detail page (e.g. '/blog/my-post')
 *
 * @example
 * ```ts
 * revalidateEntity('blog', 'my-post');
 * // → revalidates /blog  AND  /blog/my-post
 * ```
 */
export function revalidateEntity(entity: string, slug?: string) {
  const paths = ENTITY_PATHS[entity] ?? [];
  for (const p of paths) {
    revalidatePath(p, 'page');
    if (slug) {
      revalidatePath(`${p}/${slug}`, 'page');
    }
  }
}
