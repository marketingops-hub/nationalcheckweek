import { createClient as adminClient } from "@supabase/supabase-js";
import UsersClient from "@/components/admin/UsersClient";

async function getUsers() {
  const sb = adminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data, error } = await sb.auth.admin.listUsers();
  if (error) return [];
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
      <div className="mb-8">
        <h1 className="text-xl font-semibold mb-1" style={{ color: "#E6EDF3" }}>User Management</h1>
        <p className="text-sm" style={{ color: "#6E7681" }}>
          Create, edit or delete admin users who have access to the backend.
        </p>
      </div>
      <UsersClient initialUsers={users} />
    </div>
  );
}
