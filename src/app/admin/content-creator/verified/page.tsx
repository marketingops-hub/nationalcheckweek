/* ═══════════════════════════════════════════════════════════════════════════
 * /admin/content-creator/verified
 *
 * Apr-2026: verified view now lives inside the unified Content Library.
 * Kept as a redirect so old links land on the right tab.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { redirect } from 'next/navigation';

export default function VerifiedPage() {
  redirect('/admin/content-creator/library?tab=verified');
}
