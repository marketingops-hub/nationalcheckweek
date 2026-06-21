import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin, validatePassword } from "@/lib/auth";
import { USER_ROLES } from "@/lib/adminSchemas";

export const GET = requireAdmin(async () => {
  const sb = adminClient();
  const { data, error } = await sb.auth.admin.listUsers();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: profiles } = await sb.from('user_profiles').select('id, role');
  const roleMap = new Map((profiles ?? []).map(p => [p.id, p.role ?? 'admin']));

  return NextResponse.json(data.users.map(u => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
    role: roleMap.get(u.id) ?? 'admin',
  })));
});

export const POST = requireAdmin(async (req: NextRequest) => {
  const body = await req.json();
  const { email, password, role = 'admin' } = body;

  if (!email || !password) return NextResponse.json({ error: "email and password required" }, { status: 400 });
  if (!USER_ROLES.includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) return NextResponse.json({ error: passwordValidation.error }, { status: 400 });

  const sb = adminClient();
  const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Create user_profiles row with selected role
  await sb.from('user_profiles').upsert({ id: data.user.id, role }, { onConflict: 'id' });

  return NextResponse.json({ id: data.user.id, email: data.user.email, role });
});
