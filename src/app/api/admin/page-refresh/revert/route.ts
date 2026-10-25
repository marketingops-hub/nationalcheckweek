import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff, type AuthedRequest } from "@/lib/auth";
import { revertToVersion } from "@/lib/pageRefresh/service";
import { fail } from "../_http";

export const runtime = "nodejs";

const bodySchema = z.object({ version_id: z.string().uuid() });

/** POST /api/admin/page-refresh/revert — restore an earlier version (published as a new version). */
export const POST = requireStaff(async (req: NextRequest) => {
  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "version_id is required." }, { status: 400 });

  const user = (req as AuthedRequest).user;
  try {
    const version = await revertToVersion(body.data.version_id, { id: user.id, email: user.email });
    return NextResponse.json({ version });
  } catch (err) {
    return fail(err);
  }
});
