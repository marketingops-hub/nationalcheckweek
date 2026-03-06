import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StateEditForm from "@/components/admin/StateEditForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditStatePage({ params }: Props) {
  const { id } = await params;
  const sb = await createClient();

  const { data: state } = await sb.from("states").select("*").eq("id", id).single();
  if (!state) notFound();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold mb-1" style={{ color: "#E6EDF3" }}>
          Edit State
        </h1>
        <p className="text-sm" style={{ color: "#6E7681" }}>
          {state.icon} {state.name}
        </p>
      </div>
      <StateEditForm state={state} />
    </div>
  );
}
