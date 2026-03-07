import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';
import './admin.css';

export const metadata = {
  title: 'Admin — Schools Wellbeing Australia',
};

export function generateStaticParams() { return []; }

const MATERIAL_SYMBOLS_URL =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';
const INTER_URL =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read x-pathname set by middleware to detect login page
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';

  const fonts = (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={INTER_URL} />
      <link rel="stylesheet" href={MATERIAL_SYMBOLS_URL} />
    </>
  );

  // Login page renders standalone — no sidebar, no header
  if (pathname === '/admin/login') {
    return <div className="admin-shell">{fonts}{children}</div>;
  }

  let email = '';
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    email = user?.email ?? '';
  } catch {
    // Supabase unavailable — still render the shell
  }

  return (
    <div className="admin-shell flex h-screen overflow-hidden">
      {fonts}
      <AdminSidebar userEmail={email} />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AdminTopbar email={email} />
        <div className="p-8 space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
