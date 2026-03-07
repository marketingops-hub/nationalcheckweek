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
      <div className="admin-page-header">
        <h1>{page.title}</h1>
      </div>
      <PageEditor page={page} />
    </div>
  );
}
