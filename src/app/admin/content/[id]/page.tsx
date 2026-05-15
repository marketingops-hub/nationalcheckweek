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
      <div className="swa-page-header" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="swa-page-title">Edit Area</h1>
          <p className="swa-page-subtitle">{area.name} · {area.state}</p>
        </div>
        <a
          href={`/areas/${area.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="swa-btn swa-btn--ghost"
          style={{ fontSize: 13 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
          View on site
        </a>
      </div>
      <AreaEditForm area={area} />
    </div>
  );
}
