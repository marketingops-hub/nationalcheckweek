import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import StatesClient from "@/components/admin/StatesClient";

export const dynamic = 'force-dynamic';

export default async function AdminStatesPage() {
  let states: { id: string; slug: string; name: string; icon: string; subtitle: string; issues: string[] | null; updated_at: string }[] | null = null;
  let fetchError = "";
  try {
    const sb = await createClient();
    const res = await sb
      .from("states")
      .select("id, slug, name, icon, subtitle, issues, updated_at")
      .order("name");
    states = res.data;
    if (res.error) fetchError = res.error.message;
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Failed to load states.";
  }

  return (
    <div>
      {/* Page header */}
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">States &amp; Territories</h1>
          <p className="swa-page-subtitle">Manage Australian states and territories with wellbeing issue tracking.</p>
        </div>
        <Link href="/admin/states/new" className="swa-btn swa-btn--primary" style={{ textDecoration: 'none' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          New State
        </Link>
      </div>

      {fetchError && (
        <div className="swa-alert swa-alert--error" style={{ marginBottom: 24 }}>{fetchError}</div>
      )}

      <StatesClient states={states ?? []} />
    </div>
  );
}
