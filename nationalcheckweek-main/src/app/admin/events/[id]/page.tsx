import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import EventEditForm from "@/components/admin/EventEditForm";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: Props) {
  const { id } = await params;
  const sb = adminClient();

  const { data, error } = await sb
    .from("events")
    .select("*, event_speakers(*)")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <div style={{ fontSize: "0.78rem", color: "#9CA3AF", marginBottom: 4 }}>
            <Link href="/admin/events" style={{ color: "#7C3AED", fontWeight: 600 }}>Events</Link>
            {" / "}Edit
          </div>
          <h1 className="swa-page-title">{data.title}</h1>
          <p className="swa-page-subtitle">/events/{data.slug}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {data.published && (
            <a
              href={`/events/${data.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="swa-btn swa-btn--ghost"
              style={{ fontSize: "0.85rem" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
              View on site
            </a>
          )}
        </div>
      </div>
      <EventEditForm event={data} />
    </div>
  );
}
