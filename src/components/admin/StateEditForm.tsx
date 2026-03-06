"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface StateIssue { name: string; badge: string; stat: string; desc: string; }

interface State {
  id: string;
  slug: string;
  name: string;
  icon: string;
  subtitle: string;
  issues: StateIssue[];
}

const INPUT = "w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500";
const INPUT_STYLE = { background: "#0D1117", border: "1px solid #30363D", color: "#C9D1D9" };
const LABEL = "block text-xs font-semibold mb-1.5 uppercase tracking-wide";
const LABEL_STYLE = { color: "#6E7681" };
const FIELD = "mb-5";

export default function StateEditForm({ state }: { state: State }) {
  const router = useRouter();
  const [form, setForm] = useState({
    slug: state.slug,
    name: state.name,
    icon: state.icon,
    subtitle: state.subtitle,
    issues: JSON.stringify(state.issues, null, 2),
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

    let issues: StateIssue[];
    try {
      issues = JSON.parse(form.issues);
    } catch {
      setError("Invalid JSON in Issues field.");
      setSaving(false);
      return;
    }

    const sb = createClient();
    const { error: err } = await sb.from("states").update({
      slug: form.slug.trim(),
      name: form.name.trim(),
      icon: form.icon.trim(),
      subtitle: form.subtitle.trim(),
      issues,
    }).eq("id", state.id);

    if (err) {
      setError(err.message);
    } else {
      setSuccess(true);
      router.refresh();
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${state.name}"? This cannot be undone.`)) return;
    const sb = createClient();
    await sb.from("states").delete().eq("id", state.id);
    router.push("/admin/states");
    router.refresh();
  }

  return (
    <div className="max-w-3xl">
      <div className="rounded-xl p-6 mb-6" style={{ background: "#161B22", border: "1px solid #21262D" }}>
        <h2 className="text-sm font-semibold mb-5" style={{ color: "#E6EDF3" }}>Basic Info</h2>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Icon</label>
            <input className={INPUT} style={INPUT_STYLE} value={form.icon}
              onChange={e => set("icon", e.target.value)} />
          </div>
          <div>
            <label className={LABEL} style={LABEL_STYLE}>Slug</label>
            <input className={INPUT} style={INPUT_STYLE} value={form.slug}
              onChange={e => set("slug", e.target.value)} />
          </div>
        </div>
        <div className={FIELD}>
          <label className={LABEL} style={LABEL_STYLE}>Name</label>
          <input className={INPUT} style={INPUT_STYLE} value={form.name}
            onChange={e => set("name", e.target.value)} />
        </div>
        <div>
          <label className={LABEL} style={LABEL_STYLE}>Subtitle</label>
          <input className={INPUT} style={INPUT_STYLE} value={form.subtitle}
            onChange={e => set("subtitle", e.target.value)} />
        </div>
      </div>

      <div className="rounded-xl p-6 mb-6" style={{ background: "#161B22", border: "1px solid #21262D" }}>
        <h2 className="text-sm font-semibold mb-2" style={{ color: "#E6EDF3" }}>Priority Issues</h2>
        <p className="text-xs mb-4" style={{ color: "#484F58" }}>
          JSON array of objects with keys: name, badge (badge-critical | badge-high | badge-notable), stat, desc
        </p>
        <textarea
          rows={20}
          className={`${INPUT} font-mono text-xs`}
          style={INPUT_STYLE}
          value={form.issues}
          onChange={e => set("issues", e.target.value)}
        />
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
          onClick={() => router.push("/admin/states")}
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
