"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Area {
  id: string;
  slug: string;
  name: string;
  state: string;
  state_slug: string;
  type: string;
  population: string;
  schools: string;
  overview: string;
  key_stats: unknown;
  issues: unknown;
  prevention: string;
}

const INPUT = "w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500";
const INPUT_STYLE = { background: "#0D1117", border: "1px solid #30363D", color: "#C9D1D9" };
const LABEL = "block text-xs font-semibold mb-1.5 uppercase tracking-wide";
const LABEL_STYLE = { color: "#6E7681" };
const FIELD = "mb-5";

export default function AreaEditForm({ area }: { area: Area }) {
  const router = useRouter();
  const [form, setForm] = useState({
    slug: area.slug,
    name: area.name,
    state: area.state,
    state_slug: area.state_slug,
    type: area.type,
    population: area.population,
    schools: area.schools,
    overview: area.overview,
    key_stats: JSON.stringify(area.key_stats, null, 2),
    issues: JSON.stringify(area.issues, null, 2),
    prevention: area.prevention,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
    setSuccess(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess(false);

    let key_stats: unknown;
    let issues: unknown;
    try {
      key_stats = JSON.parse(form.key_stats);
      issues = JSON.parse(form.issues);
    } catch {
      setError("Invalid JSON in Key Stats or Issues field.");
      setSaving(false);
      return;
    }

    const sb = createClient();
    const { error: err } = await sb.from("areas").update({
      slug: form.slug.trim(),
      name: form.name.trim(),
      state: form.state.trim(),
      state_slug: form.state_slug.trim(),
      type: form.type,
      population: form.population.trim(),
      schools: form.schools.trim(),
      overview: form.overview.trim(),
      key_stats,
      issues,
      prevention: form.prevention.trim(),
    }).eq("id", area.id);

    if (err) {
      setError(err.message);
    } else {
      setSuccess(true);
      router.refresh();
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${area.name}"? This cannot be undone.`)) return;
    const sb = createClient();
    await sb.from("areas").delete().eq("id", area.id);
    router.push("/admin/content");
    router.refresh();
  }

  return (
    <div className="max-w-3xl">
      {/* Basic Info */}
      <div className="rounded-xl p-6 mb-6" style={{ background: "#161B22", border: "1px solid #21262D" }}>
        <h2 className="text-sm font-semibold mb-5" style={{ color: "#E6EDF3" }}>Basic Info</h2>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Slug</label>
            <input className={INPUT} style={INPUT_STYLE} value={form.slug}
              onChange={e => set("slug", e.target.value)} />
          </div>
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Type</label>
            <select className={INPUT} style={INPUT_STYLE} value={form.type}
              onChange={e => set("type", e.target.value)}>
              <option value="city">City</option>
              <option value="region">Region</option>
              <option value="lga">LGA</option>
            </select>
          </div>
        </div>
        <div className={FIELD}>
          <label className={LABEL} style={LABEL_STYLE}>Name</label>
          <input className={INPUT} style={INPUT_STYLE} value={form.name}
            onChange={e => set("name", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className={LABEL} style={LABEL_STYLE}>State</label>
            <input className={INPUT} style={INPUT_STYLE} value={form.state}
              onChange={e => set("state", e.target.value)} />
          </div>
          <div>
            <label className={LABEL} style={LABEL_STYLE}>State Slug</label>
            <input className={INPUT} style={INPUT_STYLE} value={form.state_slug}
              onChange={e => set("state_slug", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Population</label>
            <input className={INPUT} style={INPUT_STYLE} value={form.population}
              onChange={e => set("population", e.target.value)} />
          </div>
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Schools</label>
            <input className={INPUT} style={INPUT_STYLE} value={form.schools}
              onChange={e => set("schools", e.target.value)} />
          </div>
        </div>
        <div className={FIELD}>
          <label className={LABEL} style={LABEL_STYLE}>Overview</label>
          <textarea rows={4} className={INPUT} style={INPUT_STYLE} value={form.overview}
            onChange={e => set("overview", e.target.value)} />
        </div>
        <div>
          <label className={LABEL} style={LABEL_STYLE}>Prevention Insight</label>
          <textarea rows={3} className={INPUT} style={INPUT_STYLE} value={form.prevention}
            onChange={e => set("prevention", e.target.value)} />
        </div>
      </div>

      {/* Structured Data */}
      <div className="rounded-xl p-6 mb-6" style={{ background: "#161B22", border: "1px solid #21262D" }}>
        <h2 className="text-sm font-semibold mb-2" style={{ color: "#E6EDF3" }}>Structured Data</h2>
        <p className="text-xs mb-5" style={{ color: "#484F58" }}>Edit as JSON arrays.</p>
        <div className={FIELD}>
          <label className={LABEL} style={LABEL_STYLE}>
            Key Stats — array of {`{num, label}`}
          </label>
          <textarea rows={8} className={`${INPUT} font-mono text-xs`} style={INPUT_STYLE}
            value={form.key_stats} onChange={e => set("key_stats", e.target.value)} />
        </div>
        <div>
          <label className={LABEL} style={LABEL_STYLE}>
            Issues — array of {`{title, severity, stat, desc}`}
          </label>
          <textarea rows={16} className={`${INPUT} font-mono text-xs`} style={INPUT_STYLE}
            value={form.issues} onChange={e => set("issues", e.target.value)} />
        </div>
      </div>

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
          onClick={() => router.push("/admin/content")}
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
