import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const SEVERITY_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  critical: { bg: "#3D1515", color: "#F87171", label: "Critical" },
  high:     { bg: "#2D2008", color: "#FCD34D", label: "High" },
  notable:  { bg: "#0D2D1A", color: "#6EE7B7", label: "Notable" },
};

export default async function AdminIssuesPage() {
  const sb = await createClient();
  const { data: issues } = await sb
    .from("issues")
    .select("id, rank, slug, icon, title, severity, anchor_stat, updated_at")
    .order("rank");

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold mb-1" style={{ color: "#E6EDF3" }}>Issues</h1>
          <p className="text-sm" style={{ color: "#6E7681" }}>
            {issues?.length ?? 0} wellbeing issues tracked across Australian schools.
          </p>
        </div>
        <Link
          href="/admin/issues/new"
          className="text-sm font-semibold px-4 py-2 rounded-lg"
          style={{ background: "#238636", color: "#FFFFFF" }}
        >
          + New Issue
        </Link>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #21262D" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#161B22", borderBottom: "1px solid #21262D" }}>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: "#6E7681", width: "48px" }}>#</th>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: "#6E7681" }}>Issue</th>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: "#6E7681" }}>Severity</th>
              <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: "#6E7681" }}>Anchor Stat</th>
              <th className="text-right px-4 py-3 font-semibold" style={{ color: "#6E7681" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(issues ?? []).map((issue, idx) => {
              const sev = SEVERITY_STYLE[issue.severity] ?? SEVERITY_STYLE.notable;
              return (
                <tr
                  key={issue.id}
                  style={{
                    background: idx % 2 === 0 ? "#0D1117" : "#161B22",
                    borderBottom: "1px solid #21262D",
                  }}
                >
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "#484F58" }}>{issue.rank}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{issue.icon}</span>
                      <span className="font-medium" style={{ color: "#C9D1D9" }}>{issue.title}</span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "#484F58" }}>/issues/{issue.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{ background: sev.bg, color: sev.color }}
                    >
                      {sev.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs" style={{ color: "#6E7681", maxWidth: "260px" }}>
                    <div className="truncate">{issue.anchor_stat}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/issues/${issue.id}`}
                      className="text-xs font-semibold px-3 py-1.5 rounded"
                      style={{ background: "#21262D", color: "#C9D1D9" }}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
