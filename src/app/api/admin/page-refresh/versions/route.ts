import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { entityKeySchema, entityTypeSchema } from "@/lib/pageRefresh/entities";
import { listVersions } from "@/lib/pageRefresh/service";
import { fail } from "../_http";

export const runtime = "nodejs";

const querySchema = z.object({ entity_type: entityTypeSchema, entity_key: entityKeySchema });

/** GET /api/admin/page-refresh/versions?entity_type=area&entity_key=melbourne — newest first. */
export const GET = requireStaff(async (req: NextRequest) => {
  const q = querySchema.safeParse({
    entity_type: req.nextUrl.searchParams.get("entity_type"),
    entity_key: req.nextUrl.searchParams.get("entity_key"),
  });
  if (!q.success) return NextResponse.json({ error: "entity_type and entity_key are required." }, { status: 400 });

  try {
    return NextResponse.json({ versions: await listVersions(q.data.entity_type, q.data.entity_key) });
  } catch (err) {
    return fail(err);
  }
});
