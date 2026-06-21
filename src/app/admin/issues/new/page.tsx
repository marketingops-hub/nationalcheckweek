import Link from "next/link";
import IssueEditForm from "@/components/admin/IssueEditForm";

export default function NewIssuePage() {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2 text-xs">
          <Link href="/admin/issues" style={{ color: "var(--admin-accent)" }} className="font-semibold uppercase tracking-widest hover:underline">
            Issues
          </Link>
          <span style={{ color: "var(--admin-border-strong)" }}>/</span>
          <span className="font-semibold uppercase tracking-widest" style={{ color: "var(--admin-text-subtle)" }}>New Issue</span>
        </div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--admin-text-primary)", letterSpacing: "-0.025em" }}>
          New Issue
        </h1>
        <p className="text-sm" style={{ color: "var(--admin-text-subtle)" }}>
          Fill in the details below and click Create Issue to save.
        </p>
      </div>
      <IssueEditForm issue={null} initialSources={[]} />
    </div>
  );
}
