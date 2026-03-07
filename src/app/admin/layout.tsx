import { redirect } from 'next/navigation';
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
  // Middleware sets x-pathname — skip auth wrapper for login page
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const email = (user as NonNullable<typeof user>).email ?? '';

  return (
    <div className="min-h-screen flex" style={{ background: '#0D1117' }}>
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
