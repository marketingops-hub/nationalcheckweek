export type Role = 'editor' | 'admin' | 'super_admin';

/* ─── Path prefixes allowed per role ─────────────────────────────────────
 *
 * Rules are prefix-matched. A role inherits all paths from roles below it.
 *
 *  editor      → content creation & publishing only
 *  admin       → editor + data management + system config (no user management)
 *  super_admin → everything
 *
 * ─────────────────────────────────────────────────────────────────────── */

const EDITOR_PATHS = [
  '/admin',                      // dashboard (exact match handled separately)
  '/admin/blog',
  '/admin/events',
  '/admin/issues',
  '/admin/voice',
  '/admin/ambassadors',
  '/admin/submissions',
  '/admin/partners',
  '/admin/resources',
  '/admin/faq',
  '/admin/cms/pages',
  '/admin/vault',
  '/admin/simple-content',
  '/admin/content-creator',
  '/admin/content-moderation',    // editors submit AND review/approve each other's drafts
  '/admin/tutorial',
  '/admin/login',
];

const ADMIN_PATHS = [
  ...EDITOR_PATHS,
  '/admin/votes',
  '/admin/states',
  '/admin/content',              // areas
  '/admin/schools',
  '/admin/homepage-builder',
  '/admin/site-settings',
  '/admin/home-page',
  '/admin/cms/menu',
  '/admin/cms/redirects',
  '/admin/prompts',
  '/admin/seo',
  '/admin/typography',
  '/admin/api',
  '/admin/settings',
  '/admin/your-voice',           // public "Have Your Say" page content + HubSpot form config
];

const SUPER_ADMIN_PATHS = [
  ...ADMIN_PATHS,
  '/admin/users',
];

const ROLE_PATHS: Record<Role, string[]> = {
  editor:      EDITOR_PATHS,
  admin:       ADMIN_PATHS,
  super_admin: SUPER_ADMIN_PATHS,
};

/** Returns true if the given role is permitted to access the pathname. */
export function canAccess(role: Role, pathname: string): boolean {
  const allowed = ROLE_PATHS[role] ?? [];
  return allowed.some(prefix =>
    prefix === '/admin'
      ? pathname === '/admin'          // exact match for dashboard
      : pathname.startsWith(prefix)
  );
}

/** Sidebar items filtered to those the role can see. */
export function allowedPaths(role: Role): string[] {
  return ROLE_PATHS[role] ?? [];
}

export const ROLE_LABELS: Record<Role, string> = {
  editor:      'Editor',
  admin:       'Admin',
  super_admin: 'Super Admin',
};

export const ROLE_COLORS: Record<Role, string> = {
  editor:      '#0891b2',
  admin:       '#7c3aed',
  super_admin: '#dc2626',
};
