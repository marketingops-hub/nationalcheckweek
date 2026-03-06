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
        <h1 className="text-xl font-semibold mb-1" style={{ color: "#E6EDF3" }}>
          Edit Area
        </h1>
        <p className="text-sm" style={{ color: "#6E7681" }}>
          {area.name} · {area.state}
        </p>
      </div>
      <AreaEditForm area={area} />
    </div>
  );
}
