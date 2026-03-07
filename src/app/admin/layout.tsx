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
    <div className="admin-shell min-h-screen flex" style={{ background: 'var(--admin-bg-page)' }}>
      <AdminSidebar userEmail={email} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-8 flex-shrink-0"
          style={{ background: '#fff', borderBottom: '1px solid var(--admin-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div />
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--admin-text-subtle)', border: '1px solid var(--admin-border)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              View site
            </a>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff' }}>
              {(email || 'A')[0].toUpperCase()}
            </div>
          </div>
        </header>
        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
