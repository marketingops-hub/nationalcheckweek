import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin, validatePassword } from "@/lib/auth";

export const GET = requireAdmin(async () => {
  const sb = adminClient();
  const { data, error } = await sb.auth.admin.listUsers();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data.users.map(u => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
  })));
});

export const POST = requireAdmin(async (req: NextRequest) => {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "email and password required" }, { status: 400 });
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return NextResponse.json({ error: passwordValidation.error }, { status: 400 });
  }
  const sb = adminClient();
  const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.user.id, email: data.user.email });
});
