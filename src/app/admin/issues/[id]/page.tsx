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
        <h1 className="text-xl font-semibold mb-1" style={{ color: "#E6EDF3" }}>
          Edit Issue
        </h1>
        <p className="text-sm" style={{ color: "#6E7681" }}>
          {issue.icon} {issue.title}
        </p>
      </div>
      <IssueEditForm issue={issue} />
    </div>
  );
}
