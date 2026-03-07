import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import IssueEditForm from "@/components/admin/IssueEditForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditIssuePage({ params }: Props) {
  const { id } = await params;
  const sb = await createClient();

  const { data: issue } = await sb.from("issues").select("*").eq("id", id).single();
  if (!issue) notFound();

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2 text-xs">
          <Link href="/admin/issues" style={{ color: "#58A6FF" }} className="font-semibold uppercase tracking-widest">Issues</Link>
          <span style={{ color: "#30363D" }}>/</span>
          <span className="font-semibold uppercase tracking-widest" style={{ color: "#6E7681" }}>{issue.title}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold mb-1" style={{ color: "#E6EDF3" }}>Edit Issue</h1>
            <p className="text-sm" style={{ color: "#6E7681" }}>{issue.icon} {issue.title}</p>
          </div>
          <Link href={`/issues/${issue.slug}`} target="_blank"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: "#161B22", color: "#6E7681", border: "1px solid #21262D" }}>
            View on site ↗
          </Link>
        </div>
      </div>
      <IssueEditForm issue={issue} />
    </div>
  );
}
