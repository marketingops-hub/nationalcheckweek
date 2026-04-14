export const PAGE_FIELDS = [
  "slug",
  "title",
  "description",
  "content",
  "status",
  "show_in_menu",
  "meta_title",
  "meta_desc",
  "og_image",
] as const;

export type PageField = typeof PAGE_FIELDS[number];

export const PAGE_DEFAULTS: Record<PageField, unknown> = {
  slug:         "",
  title:        "",
  description:  "",
  content:      [],
  status:       "draft",
  show_in_menu: false,
  meta_title:   "",
  meta_desc:    "",
  og_image:     "",
};

export function pickPageFields(body: Record<string, unknown>) {
  return Object.fromEntries(
    PAGE_FIELDS.filter(k => body[k] !== undefined).map(k => [k, body[k]])
  );
}
