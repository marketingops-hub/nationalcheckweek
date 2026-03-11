import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// PATCH /api/admin/faq/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = adminClient();
  const body = await req.json();
  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };

  if (body.question !== undefined) patch.question = body.question;
  if (body.answer !== undefined) patch.answer = body.answer;
  if (body.category !== undefined) patch.category = body.category || null;
  if (body.sortOrder !== undefined) patch.sortOrder = body.sortOrder;
  if (typeof body.active === "boolean") patch.active = body.active;

  const { data, error } = await sb
    .from("Faq")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ faq: data });
}

// DELETE /api/admin/faq/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = adminClient();
  const { error } = await sb.from("Faq").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
