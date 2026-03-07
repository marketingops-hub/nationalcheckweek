"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SeoPanel from "@/components/admin/SeoPanel";

interface StateIssue { name: string; badge: string; stat: string; desc: string; }

interface State {
  id: string;
  slug: string;
  name: string;
  icon: string;
  subtitle: string;
  issues: StateIssue[];
  seo_title?: string;
  seo_desc?: string;
  og_image?: string;
}

const I = "w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors";
const IS = { background: "#0D1117", border: "1px solid #30363D", color: "#C9D1D9" };
const L = "block text-xs font-semibold mb-1.5 uppercase tracking-wider";
const LS = { color: "#6E7681" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-4"><label className={L} style={LS}>{label}</label>{children}</div>;
}

function parseJsonArray<T>(raw: unknown, fallback: T[]): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return fallback; } }
  return fallback;
}

const BADGE_OPTIONS = [
  { value: "badge-critical", label: "Critical", bg: "#3D1515", color: "#F87171", border: "#7F1D1D" },
  { value: "badge-high",     label: "High",     bg: "#2D1A00", color: "#F59E0B", border: "#78350F" },
  { value: "badge-notable",  label: "Notable",  bg: "#0D2D1A", color: "#6EE7B7", border: "#166534" },
];

function StateIssueCard({ issue, idx, onChange, onRemove }: {
  issue: StateIssue; idx: number;
  onChange: (idx: number, field: keyof StateIssue, val: string) => void;
  onRemove: (idx: number) => void;
}) {
  const badge = BADGE_OPTIONS.find(b => b.value === issue.badge) ?? BADGE_OPTIONS[2];
  return (
    <div className="rounded-lg p-4" style={{ background: "#0D1117", border: "1px solid #30363D", borderLeft: `3px solid ${badge.color}` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#484F58" }}>Issue #{idx + 1}</span>
        <button onClick={() => onRemove(idx)} className="text-xs px-2 py-1 rounded" style={{ color: "#F87171", background: "#3D1515" }}>Remove</button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-1">
        <Field label="Issue Name">
          <input className={I} style={IS} value={issue.name} onChange={e => onChange(idx, "name", e.target.value)} placeholder="e.g. Anxiety" />
        </Field>
        <Field label="Severity Badge">
          <select className={I} style={IS} value={issue.badge} onChange={e => onChange(idx, "badge", e.target.value)}>
            {BADGE_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Key Stat">
        <input className={I} style={IS} value={issue.stat} onChange={e => onChange(idx, "stat", e.target.value)} placeholder="e.g. 1 in 5 students" />
      </Field>
      <Field label="Description">
        <textarea rows={2} className={I} style={{ ...IS, resize: "vertical" }} value={issue.desc} onChange={e => onChange(idx, "desc", e.target.value)} placeholder="Brief description of this issue in this state…" />
      </Field>
      <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
        {badge.label}
      </span>
    </div>
  );
}

export default function StateEditForm({ state }: { state: State | null }) {
  const router = useRouter();
  const isNew = !state;
  const [tab, setTab] = useState<"info" | "issues" | "seo">("info");

  const [form, setForm] = useState({
    slug: state?.slug ?? "",
    name: state?.name ?? "",
    icon: state?.icon ?? "",
    subtitle: state?.subtitle ?? "",
    seo_title: state?.seo_title ?? "",
    seo_desc: state?.seo_desc ?? "",
    og_image: state?.og_image ?? "",
  });
  const [issues, setIssues] = useState<StateIssue[]>(
    parseJsonArray<StateIssue>(state?.issues, [])
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
    setSuccess(false);
  }

  function updateIssue(idx: number, field: keyof StateIssue, val: string) {
    setIssues(s => s.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  }
  function removeIssue(idx: number) { setIssues(s => s.filter((_, i) => i !== idx)); }
  function addIssue() { setIssues(s => [...s, { name: "", badge: "badge-notable", stat: "", desc: "" }]); }

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!form.slug.trim()) { setError("Slug is required."); return; }
    setSaving(true);
    setError("");
    setSuccess(false);

    const sb = createClient();
    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      icon: form.icon.trim(),
      subtitle: form.subtitle.trim(),
      issues,
      seo_title: form.seo_title.trim(),
      seo_desc: form.seo_desc.trim(),
      og_image: form.og_image.trim(),
    };

    if (isNew) {
      const { data, error: err } = await sb.from("states").insert(payload).select("id").single();
      if (err) { setError(err.message); } else if (data) {
        router.push(`/admin/states/${data.id}`);
        router.refresh();
        return;
      }
    } else {
      const { error: err } = await sb.from("states").update(payload).eq("id", state!.id);
      if (err) { setError(err.message); } else { setSuccess(true); router.refresh(); }
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!state || !confirm(`Delete "${state.name}"? This cannot be undone.`)) return;
    const sb = createClient();
    await sb.from("states").delete().eq("id", state.id);
    router.push("/admin/states");
    router.refresh();
  }

  const TABS = [
    { id: "info",   label: "Basic Info",       count: null },
    { id: "issues", label: "Priority Issues",  count: issues.length },
    { id: "seo",    label: "SEO",              count: null },
  ] as const;

  return (
    <div className="max-w-4xl">
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: "#161B22", border: "1px solid #21262D" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center"
            style={tab === t.id ? { background: "#1C7ED6", color: "#fff" } : { background: "transparent", color: "#6E7681" }}>
            {t.label}
            {t.count !== null && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: tab === t.id ? "rgba(255,255,255,0.2)" : "#21262D", color: tab === t.id ? "#fff" : "#8B949E" }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Basic Info ── */}
      {tab === "info" && (
        <div className="rounded-xl p-6" style={{ background: "#161B22", border: "1px solid #21262D" }}>
          <div className="grid grid-cols-2 gap-4 mb-1">
            <Field label="Icon (emoji)">
              <input className={I} style={IS} value={form.icon} onChange={e => set("icon", e.target.value)} placeholder="🏫" />
            </Field>
            <Field label="Slug">
              <input className={I} style={IS} value={form.slug} onChange={e => set("slug", e.target.value)} placeholder="e.g. nsw" />
            </Field>
          </div>
          <Field label="Name">
            <input className={I} style={{ ...IS, fontSize: "1rem", fontWeight: 600 }} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. New South Wales" />
          </Field>
          <Field label="Subtitle">
            <input className={I} style={IS} value={form.subtitle} onChange={e => set("subtitle", e.target.value)} placeholder="e.g. Key wellbeing challenges for NSW schools" />
          </Field>
        </div>
      )}

      {/* ── Tab: Priority Issues ── */}
      {tab === "issues" && (
        <div className="rounded-xl p-6" style={{ background: "#161B22", border: "1px solid #21262D" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "#E6EDF3" }}>Priority Issues</h2>
              <p className="text-xs mt-0.5" style={{ color: "#484F58" }}>Top wellbeing issues for this state/territory</p>
            </div>
            <button onClick={addIssue} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: "#238636", color: "#fff" }}>
              + Add Issue
            </button>
          </div>
          {issues.length === 0 ? (
            <div className="rounded-lg p-6 text-center" style={{ border: "2px dashed #21262D" }}>
              <p className="text-xs" style={{ color: "#484F58" }}>No priority issues yet — click &quot;Add Issue&quot; to add one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map((iss, idx) => (
                <StateIssueCard key={idx} issue={iss} idx={idx} onChange={updateIssue} onRemove={removeIssue} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: SEO ── */}
      {tab === "seo" && (
        <SeoPanel
          seoTitle={form.seo_title}
          seoDesc={form.seo_desc}
          ogImage={form.og_image}
          defaultTitle={`${form.name} — Wellbeing Data`}
          defaultDesc={form.subtitle}
          onChange={(field, value) => set(field, value)}
        />
      )}

      {/* Actions bar */}
      <div className="mt-6">
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
          <button onClick={handleSave} disabled={saving}
            className="text-sm font-semibold px-5 py-2 rounded-lg"
            style={{ background: saving ? "#21262D" : "#238636", color: "#FFFFFF", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : isNew ? "Create State" : "Save Changes"}
          </button>
          <button onClick={() => router.push("/admin/states")}
            className="text-sm font-semibold px-5 py-2 rounded-lg"
            style={{ background: "#21262D", color: "#C9D1D9" }}>
            Cancel
          </button>
          {!isNew && (
            <button onClick={handleDelete}
              className="text-sm font-semibold px-5 py-2 rounded-lg ml-auto"
              style={{ background: "#3D1515", color: "#F87171", border: "1px solid #7F1D1D" }}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
