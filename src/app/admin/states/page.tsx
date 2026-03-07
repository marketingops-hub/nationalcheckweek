import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminStatesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let states: any[] | null = null;
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
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold mb-1" style={{ color: "#E6EDF3" }}>States & Territories</h1>
          <p className="text-sm" style={{ color: "#6E7681" }}>
            {states?.length ?? 0} states and territories with priority wellbeing issues.
          </p>
        </div>
        <Link
          href="/admin/states/new"
          className="text-sm font-semibold px-4 py-2 rounded-lg"
          style={{ background: "#238636", color: "#FFFFFF" }}
        >
          + New State
        </Link>
      </div>

      {fetchError && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "#3D1515", color: "#F87171", border: "1px solid #7F1D1D" }}>
          {fetchError}
        </div>
      )}

      {(!states || states.length === 0) && !fetchError ? (
        <div className="rounded-xl p-10 text-center" style={{ background: "#161B22", border: "1px solid #21262D" }}>
          <div className="text-3xl mb-3">🇳🇿</div>
          <p className="text-sm font-medium mb-1" style={{ color: "#C9D1D9" }}>No states yet</p>
          <p className="text-xs mb-4" style={{ color: "#484F58" }}>Create your first state or territory.</p>
          <Link href="/admin/states/new" className="text-sm font-semibold px-4 py-2 rounded-lg inline-block"
            style={{ background: "#238636", color: "#FFFFFF" }}>
            Create a state
          </Link>
        </div>
      ) : states && states.length > 0 ? (
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #21262D" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#161B22", borderBottom: "1px solid #21262D" }}>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: "#6E7681" }}>State / Territory</th>
              <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: "#6E7681" }}>Subtitle</th>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: "#6E7681" }}>Issues</th>
              <th className="text-right px-4 py-3 font-semibold" style={{ color: "#6E7681" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(states ?? []).map((state, idx) => {
              const issueCount = Array.isArray(state.issues) ? state.issues.length : 0;
              return (
                <tr
                  key={state.id}
                  style={{
                    background: idx % 2 === 0 ? "#0D1117" : "#161B22",
                    borderBottom: "1px solid #21262D",
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{state.icon}</span>
                      <span className="font-medium" style={{ color: "#C9D1D9" }}>{state.name}</span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "#484F58" }}>/states/{state.slug}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs" style={{ color: "#6E7681", maxWidth: "300px" }}>
                    <div className="truncate">{state.subtitle}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{ background: "#1C2A3A", color: "#58A6FF" }}
                    >
                      {issueCount} issues
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/states/${state.slug}`}
                        target="_blank"
                        className="text-xs font-semibold px-3 py-1.5 rounded"
                        style={{ background: "#161B22", color: "#6E7681", border: "1px solid #21262D" }}
                      >
                        View ↗
                      </Link>
                      <Link
                        href={`/admin/states/${state.id}`}
                        className="text-xs font-semibold px-3 py-1.5 rounded"
                        style={{ background: "#21262D", color: "#C9D1D9" }}
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      ) : null}
    </div>
  );
}
