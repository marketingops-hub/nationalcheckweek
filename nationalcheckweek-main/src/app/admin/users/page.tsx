import { createClient as adminClient } from "@supabase/supabase-js";
import UsersClient from "@/components/admin/UsersClient";

export const dynamic = 'force-dynamic';

async function getUsers() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('[Admin Users] Missing Supabase credentials');
    return [];
  }
  const sb = adminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await sb.auth.admin.listUsers();
  if (error) {
    console.error('[Admin Users] Failed to fetch users:', error.message);
    return [];
  }
  return data.users.map(u => ({
    id: u.id,
    email: u.email ?? "",
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
  }));
}

export default async function AdminUsersPage() {
  const users = await getUsers();
  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">User Management</h1>
          <p className="swa-page-subtitle">Create, edit or delete admin users who have access to the backend.</p>
        </div>
      </div>
      <UsersClient initialUsers={users} />
    </div>
  );
}
