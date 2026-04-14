import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { CommandPalette } from '@/components/admin/CommandPalette';
import { ToastProvider } from '@/components/admin/ui/Toast';
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
  let authFailed = false;
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      authFailed = true;
    } else {
      email = user.email ?? '';
    }
  } catch (err) {
    console.error('[Admin Layout] Auth check failed:', err);
    authFailed = true;
  }

  // Redirect to login if auth failed
  if (authFailed && pathname !== '/admin/login') {
    const { redirect } = await import('next/navigation');
    redirect(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }

  return (
    <ToastProvider>
      <div className="admin-shell swa-root">
        {fonts}
        <AdminSidebar userEmail={email} />
        <CommandPalette />
        <div className="swa-main-area no-right-panel">
          <main className="swa-main-content">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
