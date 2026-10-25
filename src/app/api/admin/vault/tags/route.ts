import { NextResponse } from "next/server";
import { adminClient } from "@/lib/adminClient";
import { requireStaff } from "@/lib/auth";
import { countTags } from "@/lib/vault/tags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/vault/tags — every tag already used on a vault document, with counts (most used first). */
export const GET = requireStaff(async () => {
  const { data, error } = await adminClient().from("vault_documents").select("tags").limit(5000);
  if (error) return NextResponse.json({ error: "Could not load tags." }, { status: 500 });
  return NextResponse.json({ tags: countTags(data ?? []).slice(0, 300) });
});
