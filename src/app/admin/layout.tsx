import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/adminClient';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { CommandPalette } from '@/components/admin/CommandPalette';
import { ToastProvider } from '@/components/admin/ui/Toast';
import type { Role } from '@/lib/rbac';
import './admin.css';
import './swa-design.css';

export const metadata = {
  title: 'Admin — National Check-in Week',
};

export function generateStaticParams() { return []; }

const MATERIAL_SYMBOLS_URL =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';
const DM_SANS_URL =
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap';
const INTER_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
const CORMORANT_URL =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';

  const fonts = (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={DM_SANS_URL} />
      <link rel="stylesheet" href={INTER_URL} />
      <link rel="stylesheet" href={CORMORANT_URL} />
      <link rel="stylesheet" href={MATERIAL_SYMBOLS_URL} />
    </>
  );

  // Login page renders standalone
  if (pathname === '/admin/login') {
    return <div className="admin-shell">{fonts}{children}</div>;
  }

  let email = '';
  let userId = '';
  let authFailed = false;
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      authFailed = true;
    } else {
      email = user.email ?? '';
      userId = user.id;
    }
  } catch (err) {
    console.error('[Admin Layout] Auth check failed:', err);
    authFailed = true;
  }

  if (authFailed && pathname !== '/admin/login') {
    const { redirect } = await import('next/navigation');
    redirect(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }

  // Fetch role from user_profiles
  let role: Role = 'admin';
  if (userId) {
    try {
      const sb = adminClient();
      const { data } = await sb
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      if (data?.role) role = data.role as Role;
    } catch { /* default to admin */ }
  }

  const forbidden = headersList.get('x-pathname')
    ? new URL(`https://x${pathname}`).searchParams.get('error') === 'forbidden'
    : false;

  return (
    <ToastProvider>
      <div className="admin-shell swa-root">
        {fonts}
        <AdminSidebar userEmail={email} userRole={role} />
        <CommandPalette />
        <div className="swa-main-area no-right-panel">
          <main className="swa-main-content">
            {forbidden && (
              <div className="admin-alert admin-alert-error" style={{ marginBottom: 24 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'middle', marginRight: 6 }}>lock</span>
                You don&apos;t have permission to access that page. Contact a Super Admin to request access.
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
