import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AreaEditForm from "@/components/admin/AreaEditForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditAreaPage({ params }: Props) {
  const { id } = await params;
  const sb = await createClient();

  const { data: area } = await sb.from("areas").select("*").eq("id", id).single();
  if (!area) notFound();

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2 text-xs">
          <Link href="/admin/content" style={{ color: "#58A6FF" }} className="font-semibold uppercase tracking-widest">Areas</Link>
          <span style={{ color: "#30363D" }}>/</span>
          <span className="font-semibold uppercase tracking-widest" style={{ color: "#6E7681" }}>{area.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold mb-1" style={{ color: "#E6EDF3" }}>Edit Area</h1>
            <p className="text-sm" style={{ color: "#6E7681" }}>{area.name} · {area.state}</p>
          </div>
          <Link href={`/areas/${area.slug}`} target="_blank"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: "#161B22", color: "#6E7681", border: "1px solid #21262D" }}>
            View on site ↗
          </Link>
        </div>
      </div>
      <AreaEditForm area={area} />
    </div>
  );
}
