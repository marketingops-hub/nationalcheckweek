import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import * as rateLimit from "@/lib/rateLimit";
import { searchVaultSources } from "@/lib/pageRefresh/search";
import { fail } from "../_http";

export const runtime = "nodejs";
export const maxDuration = 30;

const limiter = rateLimit.create("page-refresh-search", { limit: 30, windowSeconds: 60 });
const querySchema = z.object({ q: z.string().trim().min(3).max(200) });

/** GET /api/admin/page-refresh/search?q=… — find indexed vault documents to add as sources. */
export const GET = requireStaff(async (req: NextRequest) => {
  const blocked = limiter.check(req);
  if (blocked) return blocked;

  const q = querySchema.safeParse({ q: req.nextUrl.searchParams.get("q") ?? "" });
  if (!q.success) return NextResponse.json({ error: "Type at least 3 characters to search." }, { status: 400 });

  try {
    return NextResponse.json({ results: await searchVaultSources(q.data.q) });
  } catch (err) {
    return fail(err);
  }
});
