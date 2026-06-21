import { createClient as supabaseAdmin } from "@supabase/supabase-js";
import UsersClient from "@/components/admin/UsersClient";
import type { AdminUser, AdminUserRole } from "@/components/admin/ui";

export const dynamic = 'force-dynamic';

async function getUsers(): Promise<AdminUser[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];

  const sb = supabaseAdmin(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const [{ data: authData, error: authErr }, { data: profiles }] = await Promise.all([
    sb.auth.admin.listUsers(),
    sb.from('user_profiles').select('id, role'),
  ]);

  if (authErr) { console.error('[Admin Users]', authErr.message); return []; }

  const roleMap = new Map<string, AdminUserRole>(
    (profiles ?? []).map(p => [p.id, (p.role ?? 'admin') as AdminUserRole])
  );

  return (authData?.users ?? []).map(u => ({
    id: u.id,
    email: u.email ?? '',
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    role: roleMap.get(u.id) ?? 'admin',
  }));
}

export default async function AdminUsersPage() {
  const users = await getUsers();
  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">User Management</h1>
          <p className="swa-page-subtitle">Create admin users and assign roles — Editor, Admin, or Super Admin.</p>
        </div>
      </div>
      <UsersClient initialUsers={users} />
    </div>
  );
}
