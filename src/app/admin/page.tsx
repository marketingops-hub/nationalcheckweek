import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from '@/components/admin/dashboard/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  let userEmail = '';

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userEmail = user?.email ?? '';
  } catch (e) {
    console.error('Auth error:', e);
  }

  const today = new Date().toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' });

  return <DashboardClient userEmail={userEmail} today={today} />;
}
