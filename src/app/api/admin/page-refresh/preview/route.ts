import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import * as rateLimit from "@/lib/rateLimit";
import { entityKeySchema, entityTypeSchema } from "@/lib/pageRefresh/entities";
import { previewRefresh } from "@/lib/pageRefresh/service";
import { fail } from "../_http";

export const runtime = "nodejs";
export const maxDuration = 120;

// Each preview is an AI call, so keep it modest.
const limiter = rateLimit.create("page-refresh-preview", { limit: 10, windowSeconds: 60 });

const bodySchema = z.object({
  entity_type: entityTypeSchema,
  entity_key: entityKeySchema,
  // When present, the draft is written only from these vault documents ("Regenerate").
  source_ids: z.array(z.string().uuid()).max(12).optional(),
});

/** POST /api/admin/page-refresh/preview — propose refreshed content from the vault (or only from `source_ids`). Saves nothing. */
export const POST = requireStaff(async (req: NextRequest) => {
  const blocked = limiter.check(req);
  if (blocked) return blocked;

  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "entity_type and entity_key are required." }, { status: 400 });

  try {
    return NextResponse.json(await previewRefresh(body.data.entity_type, body.data.entity_key, { sourceIds: body.data.source_ids }));
  } catch (err) {
    return fail(err);
  }
});
