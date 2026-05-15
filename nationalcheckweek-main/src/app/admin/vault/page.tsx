import { redirect } from 'next/navigation';

/* Historical sidebar entries and external links pointed to /admin/vault/.
 * Keep the URL alive by bouncing it to the library. */
export default function VaultIndexPage() {
  redirect('/admin/vault/sources');
}
