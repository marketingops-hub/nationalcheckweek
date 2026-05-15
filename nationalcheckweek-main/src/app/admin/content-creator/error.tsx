"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * Client-side error boundary for every route under /admin/content-creator.
 *
 * Next.js App Router auto-wires this file as the boundary for the segment
 * subtree. Any thrown error inside a client component below this folder
 * (dashboard, topics, ideas, drafts, [id], new, …) lands here instead of
 * showing the generic "something went wrong" crash page.
 *
 * We surface:
 *   - the error message (often an AI / Supabase error worth reading)
 *   - a digest id (Next.js assigns this for server-side crashes so you can
 *     grep Vercel logs)
 *   - a Retry button that calls the boundary-provided reset()
 *   - a link back to the dashboard as an escape hatch
 *
 * No stack trace in production — Next.js strips it and that's fine for an
 * admin UI; Vercel logs have the full stack.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect } from "react";
import Link from "next/link";

export default function ContentCreatorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Surface in the browser console so the admin can copy-paste the full
  // trace from devtools when they file a bug.
  useEffect(() => {
    console.error("[content-creator] boundary caught:", error);
  }, [error]);

  return (
    <div style={{ padding: 40, maxWidth: 720 }}>
      <div style={{
        background: '#FEF2F2',
        border: '1px solid #FECACA',
        borderRadius: 12,
        padding: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span className="material-symbols-outlined" style={{ color: '#B91C1C', fontSize: 28 }}>
            error
          </span>
          <h1 style={{ margin: 0, fontSize: 20, color: '#991B1B' }}>
            Content Creator crashed
          </h1>
        </div>

        <p style={{ color: '#7F1D1D', marginBottom: 8, fontSize: 14 }}>
          Something went wrong rendering this page. This usually means a draft,
          topic, or brief row came back in an unexpected shape. The row is
          safe — the crash is client-side only.
        </p>

        <pre style={{
          background: '#fff',
          border: '1px solid #FCA5A5',
          borderRadius: 8,
          padding: 12,
          fontSize: 12,
          color: '#7F1D1D',
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
          margin: '12px 0',
        }}>
{error.message || String(error)}
        </pre>

        {error.digest && (
          <p style={{ fontSize: 11, color: '#991B1B', fontFamily: 'monospace' }}>
            digest: {error.digest}
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={reset} className="swa-btn swa-btn--primary">
            Retry
          </button>
          <Link href="/admin/content-creator" className="swa-btn">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
