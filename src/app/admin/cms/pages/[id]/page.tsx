import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageEditor from "@/components/admin/PageEditor";

interface Props { params: Promise<{ id: string }> }

export default async function EditPagePage({ params }: Props) {
  const { id } = await params;
  const sb = await createClient();
  const { data: page } = await sb.from("pages").select("*").eq("id", id).single();
  if (!page) notFound();

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#58A6FF" }}>CMS / Pages</span>
          <span style={{ color: "#30363D" }}>/</span>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6E7681" }}>Edit</span>
        </div>
        <h1 className="text-xl font-semibold" style={{ color: "#E6EDF3" }}>{page.title}</h1>
      </div>
      <PageEditor page={page} />
    </div>
  );
}
