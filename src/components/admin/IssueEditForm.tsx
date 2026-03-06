"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ImpactBox { title: string; text: string; }

interface Issue {
  id: string;
  rank: number;
  slug: string;
  icon: string;
  severity: string;
  title: string;
  anchor_stat: string;
  short_desc: string;
  definition: string;
  australian_data: string;
  mechanisms: string;
  impacts: ImpactBox[];
  groups: string[];
  sources: string[];
}

const INPUT = "w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500";
const INPUT_STYLE = { background: "#0D1117", border: "1px solid #30363D", color: "#C9D1D9" };
const LABEL = "block text-xs font-semibold mb-1.5 uppercase tracking-wide";
const LABEL_STYLE = { color: "#6E7681" };
const FIELD = "mb-5";

export default function IssueEditForm({ issue }: { issue: Issue }) {
  const router = useRouter();
  const [form, setForm] = useState({
    rank: issue.rank,
    slug: issue.slug,
    icon: issue.icon,
    severity: issue.severity,
    title: issue.title,
    anchor_stat: issue.anchor_stat,
    short_desc: issue.short_desc,
    definition: issue.definition,
    australian_data: issue.australian_data,
    mechanisms: issue.mechanisms,
    impacts: JSON.stringify(issue.impacts, null, 2),
    groups: (issue.groups as string[]).join("\n"),
    sources: (issue.sources as string[]).join("\n"),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function set(key: string, value: string | number) {
    setForm(f => ({ ...f, [key]: value }));
    setSuccess(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess(false);

    let impacts: ImpactBox[];
    let groups: string[];
    let sources: string[];
    try {
      impacts = JSON.parse(form.impacts);
      groups = form.groups.split("\n").map(s => s.trim()).filter(Boolean);
      sources = form.sources.split("\n").map(s => s.trim()).filter(Boolean);
    } catch {
      setError("Invalid JSON in Impacts field.");
      setSaving(false);
      return;
    }

    const sb = createClient();
    const { error: err } = await sb.from("issues").update({
      rank: Number(form.rank),
      slug: form.slug.trim(),
      icon: form.icon.trim(),
      severity: form.severity,
      title: form.title.trim(),
      anchor_stat: form.anchor_stat.trim(),
      short_desc: form.short_desc.trim(),
      definition: form.definition.trim(),
      australian_data: form.australian_data.trim(),
      mechanisms: form.mechanisms.trim(),
      impacts,
      groups,
      sources,
    }).eq("id", issue.id);

    if (err) {
      setError(err.message);
    } else {
      setSuccess(true);
      router.refresh();
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${issue.title}"? This cannot be undone.`)) return;
    const sb = createClient();
    await sb.from("issues").delete().eq("id", issue.id);
    router.push("/admin/issues");
    router.refresh();
  }

  return (
    <div className="max-w-3xl">
      {/* Basic fields */}
      <div className="rounded-xl p-6 mb-6" style={{ background: "#161B22", border: "1px solid #21262D" }}>
        <h2 className="text-sm font-semibold mb-5" style={{ color: "#E6EDF3" }}>Basic Info</h2>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Rank</label>
            <input type="number" className={INPUT} style={INPUT_STYLE} value={form.rank}
              onChange={e => set("rank", e.target.value)} />
          </div>
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Icon</label>
            <input className={INPUT} style={INPUT_STYLE} value={form.icon}
              onChange={e => set("icon", e.target.value)} />
          </div>
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Severity</label>
            <select className={INPUT} style={INPUT_STYLE} value={form.severity}
              onChange={e => set("severity", e.target.value)}>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="notable">Notable</option>
            </select>
          </div>
        </div>
        <div className={FIELD}>
          <label className={LABEL} style={LABEL_STYLE}>Slug</label>
          <input className={INPUT} style={INPUT_STYLE} value={form.slug}
            onChange={e => set("slug", e.target.value)} />
        </div>
        <div className={FIELD}>
          <label className={LABEL} style={LABEL_STYLE}>Title</label>
          <input className={INPUT} style={INPUT_STYLE} value={form.title}
            onChange={e => set("title", e.target.value)} />
        </div>
        <div className={FIELD}>
          <label className={LABEL} style={LABEL_STYLE}>Anchor Stat</label>
          <input className={INPUT} style={INPUT_STYLE} value={form.anchor_stat}
            onChange={e => set("anchor_stat", e.target.value)} />
        </div>
        <div>
          <label className={LABEL} style={LABEL_STYLE}>Short Description</label>
          <textarea rows={3} className={INPUT} style={INPUT_STYLE} value={form.short_desc}
            onChange={e => set("short_desc", e.target.value)} />
        </div>
      </div>

      {/* Long-form content */}
      <div className="rounded-xl p-6 mb-6" style={{ background: "#161B22", border: "1px solid #21262D" }}>
        <h2 className="text-sm font-semibold mb-5" style={{ color: "#E6EDF3" }}>Content Sections</h2>
        <div className={FIELD}>
          <label className={LABEL} style={LABEL_STYLE}>Definition (What Is It?)</label>
          <textarea rows={4} className={INPUT} style={INPUT_STYLE} value={form.definition}
            onChange={e => set("definition", e.target.value)} />
        </div>
        <div className={FIELD}>
          <label className={LABEL} style={LABEL_STYLE}>Australian Data</label>
          <textarea rows={4} className={INPUT} style={INPUT_STYLE} value={form.australian_data}
            onChange={e => set("australian_data", e.target.value)} />
        </div>
        <div>
          <label className={LABEL} style={LABEL_STYLE}>Mechanisms (How It Affects Learning)</label>
          <textarea rows={4} className={INPUT} style={INPUT_STYLE} value={form.mechanisms}
            onChange={e => set("mechanisms", e.target.value)} />
        </div>
      </div>

      {/* JSON / list fields */}
      <div className="rounded-xl p-6 mb-6" style={{ background: "#161B22", border: "1px solid #21262D" }}>
        <h2 className="text-sm font-semibold mb-5" style={{ color: "#E6EDF3" }}>Structured Data</h2>
        <div className={FIELD}>
          <label className={LABEL} style={LABEL_STYLE}>
            Impacts — JSON array of {`{title, text}`} objects
          </label>
          <textarea rows={8} className={`${INPUT} font-mono text-xs`} style={INPUT_STYLE}
            value={form.impacts} onChange={e => set("impacts", e.target.value)} />
        </div>
        <div className={FIELD}>
          <label className={LABEL} style={LABEL_STYLE}>Groups at Risk — one per line</label>
          <textarea rows={5} className={INPUT} style={INPUT_STYLE} value={form.groups}
            onChange={e => set("groups", e.target.value)} />
        </div>
        <div>
          <label className={LABEL} style={LABEL_STYLE}>Sources — one per line</label>
          <textarea rows={4} className={INPUT} style={INPUT_STYLE} value={form.sources}
            onChange={e => set("sources", e.target.value)} />
        </div>
      </div>

      {/* Actions */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "#3D1515", color: "#F87171", border: "1px solid #7F1D1D" }}>
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "#0D2D1A", color: "#6EE7B7", border: "1px solid #166534" }}>
          ✓ Saved successfully
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-semibold px-5 py-2 rounded-lg"
          style={{ background: saving ? "#21262D" : "#238636", color: "#FFFFFF", opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
        <button
          onClick={() => router.push("/admin/issues")}
          className="text-sm font-semibold px-5 py-2 rounded-lg"
          style={{ background: "#21262D", color: "#C9D1D9" }}
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          className="text-sm font-semibold px-5 py-2 rounded-lg ml-auto"
          style={{ background: "#3D1515", color: "#F87171", border: "1px solid #7F1D1D" }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
