import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import IssuesBulkRewrite from "@/components/admin/IssuesBulkRewrite";

export const dynamic = 'force-dynamic';

export default async function AdminIssuesPage() {
  let issues: { id: string; rank: number; slug: string; icon: string; title: string; severity: string; anchor_stat: string }[] = [];
  let fetchError = "";
  try {
    const sb = await createClient();
    const res = await sb
      .from("issues")
      .select("id, rank, slug, icon, title, severity, anchor_stat")
      .order("rank");
    issues = res.data ?? [];
    if (res.error) fetchError = res.error.message;
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Failed to load issues.";
  }

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Issues</h1>
          <p className="swa-page-subtitle">{issues.length} wellbeing issues · select rows to AI-rewrite in bulk</p>
        </div>
        <Link href="/admin/issues/new" className="swa-btn swa-btn--primary">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          New Issue
        </Link>
      </div>

      {fetchError && (
        <div className="swa-alert swa-alert--error" style={{ marginBottom: 20 }}>{fetchError}</div>
      )}

      {issues.length === 0 && !fetchError ? (
        <div style={{ textAlign: "center", padding: "80px 24px", color: "#9CA3AF" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: "block", marginBottom: 16 }}>description</span>
          <h3 style={{ color: "#1E1040", marginBottom: 8 }}>No issues yet</h3>
          <p style={{ marginBottom: 20 }}>Create your first issue to start building the wellbeing database.</p>
          <Link href="/admin/issues/new" className="swa-btn swa-btn--primary">Create an issue</Link>
        </div>
      ) : (
        <IssuesBulkRewrite issues={issues} />
      )}
    </div>
  );
}
