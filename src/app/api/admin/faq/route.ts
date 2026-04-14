import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireAdmin } from "@/lib/auth";

export const runtime = "edge";

// GET /api/admin/faq
export const GET = requireAdmin(async (req: NextRequest) => {
  const sb = adminClient();
  const showAll = req.nextUrl.searchParams.get("all") === "true";

  if (showAll) {
    const { data, error } = await sb
      .from("Faq")
      .select("*")
      .order("sortOrder", { ascending: true })
      .order("createdAt", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ faqs: data ?? [] });
  }

  const { data, error } = await sb
    .from("Faq")
    .select("id, question, answer, category, sortOrder")
    .eq("active", true)
    .order("sortOrder", { ascending: true })
    .order("createdAt", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ faqs: data ?? [] });
});

// POST /api/admin/faq
export const POST = requireAdmin(async (req: NextRequest) => {
  const sb = adminClient();
  const body = await req.json();

  if (!body.question || !body.answer) {
    return NextResponse.json({ error: "question and answer are required" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("Faq")
    .insert({
      question: body.question,
      answer: body.answer,
      category: body.category || null,
      sortOrder: body.sortOrder ?? 0,
      active: body.active ?? true,
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ faq: data });
});
