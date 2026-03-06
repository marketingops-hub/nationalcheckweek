import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminContentPage() {
  const sb = await createClient();
  const { data: areas } = await sb
    .from("areas")
    .select("id, slug, name, state, type, issues, updated_at")
    .order("state")
    .order("name");

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold mb-1" style={{ color: "#E6EDF3" }}>Areas</h1>
          <p className="text-sm" style={{ color: "#6E7681" }}>
            {areas?.length ?? 0} cities, regions and LGAs with wellbeing reports.
          </p>
        </div>
        <Link
          href="/admin/content/new"
          className="text-sm font-semibold px-4 py-2 rounded-lg"
          style={{ background: "#238636", color: "#FFFFFF" }}
        >
          + New Area
        </Link>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #21262D" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#161B22", borderBottom: "1px solid #21262D" }}>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: "#6E7681" }}>Area</th>
              <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: "#6E7681" }}>State</th>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: "#6E7681" }}>Type</th>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: "#6E7681" }}>Issues</th>
              <th className="text-right px-4 py-3 font-semibold" style={{ color: "#6E7681" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(areas ?? []).map((area, idx) => {
              const issueCount = Array.isArray(area.issues) ? area.issues.length : 0;
              const typeLabel = area.type === "city" ? "City" : area.type === "lga" ? "LGA" : "Region";
              const typeColor = area.type === "city" ? "#F0883E" : area.type === "lga" ? "#A371F7" : "#58A6FF";
              const typeBg = area.type === "city" ? "#2D1A0E" : area.type === "lga" ? "#1C1433" : "#1C2A3A";
              return (
                <tr
                  key={area.id}
                  style={{
                    background: idx % 2 === 0 ? "#0D1117" : "#161B22",
                    borderBottom: "1px solid #21262D",
                  }}
                >
                  <td className="px-4 py-3">
                    <span className="font-medium" style={{ color: "#C9D1D9" }}>{area.name}</span>
                    <div className="text-xs mt-0.5" style={{ color: "#484F58" }}>/areas/{area.slug}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs" style={{ color: "#6E7681" }}>
                    {area.state}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{ background: typeBg, color: typeColor }}
                    >
                      {typeLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{ background: "#1C2A3A", color: "#58A6FF" }}
                    >
                      {issueCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/areas/${area.slug}`}
                        target="_blank"
                        className="text-xs font-semibold px-3 py-1.5 rounded"
                        style={{ background: "#161B22", color: "#6E7681", border: "1px solid #21262D" }}
                      >
                        View ↗
                      </Link>
                      <Link
                        href={`/admin/content/${area.id}`}
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
    </div>
  );
}
