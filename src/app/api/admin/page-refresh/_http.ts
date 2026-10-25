import { NextResponse } from "next/server";
import { RefreshError } from "@/lib/pageRefresh/service";

/** Map service errors to JSON responses without leaking internals. */
export function fail(err: unknown) {
  if (err instanceof RefreshError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error("[page-refresh]", err);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
