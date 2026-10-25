import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff, type AuthedRequest } from "@/lib/auth";
import { entityKeySchema, entityTypeSchema } from "@/lib/pageRefresh/entities";
import { publishRefresh } from "@/lib/pageRefresh/service";
import { fail } from "../_http";

export const runtime = "nodejs";

const bodySchema = z.object({
  entity_type: entityTypeSchema,
  entity_key: entityKeySchema,
  content: z.record(z.string(), z.unknown()),
  source_ids: z.array(z.string().uuid()).max(20),
  note: z.string().max(300).nullish(),
});

/** POST /api/admin/page-refresh/publish — publish the reviewed fields as a new version. */
export const POST = requireStaff(async (req: NextRequest) => {
  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const user = (req as AuthedRequest).user;
  try {
    const version = await publishRefresh({
      type: body.data.entity_type,
      key: body.data.entity_key,
      content: body.data.content,
      sourceIds: body.data.source_ids,
      note: body.data.note,
      actor: { id: user.id, email: user.email },
    });
    return NextResponse.json({ version });
  } catch (err) {
    return fail(err);
  }
});
