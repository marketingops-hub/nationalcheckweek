/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/content-creator/archived
 *
 * Apr-2026: archived view now lives inside the unified Content Library so
 * there's only one listing UI to maintain. This page stays as a permanent
 * redirect so old bookmarks, emails, and links keep working.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { redirect } from 'next/navigation';

export default function ArchivedPage() {
  redirect('/admin/content-creator/library?tab=archived');
}
