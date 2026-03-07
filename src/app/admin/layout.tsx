import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import AdminSidebar from '@/components/admin/AdminSidebar';

export const metadata = {
  title: 'Admin — Schools Wellbeing Australia',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read x-pathname set by middleware to detect login page
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';

  // Login page renders standalone — no sidebar, no header
  if (pathname === '/admin/login') {
    return <div className="admin-shell">{children}</div>;
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
    <div className="admin-shell min-h-screen flex" style={{ background: '#0D1117' }}>
      <AdminSidebar userEmail={email} />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="h-14 flex items-center justify-between px-6 flex-shrink-0"
          style={{ borderBottom: '1px solid #21262D', background: '#161B22' }}
        >
          <div />
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: '#6E7681' }}>{email}</span>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ background: '#1C7ED6', color: '#fff' }}
            >
              {(email || 'A')[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
