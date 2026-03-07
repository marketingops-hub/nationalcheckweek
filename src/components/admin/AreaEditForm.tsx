"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SeoPanel from "@/components/admin/SeoPanel";

interface KeyStat { num: string; label: string; }
interface Issue { title: string; severity: string; stat: string; desc: string; }

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
  seo_title?: string;
  seo_desc?: string;
  og_image?: string;
}

const I = "w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors";
const IS = { background: "#0D1117", border: "1px solid #30363D", color: "#C9D1D9" };
const IS_FOCUS = { background: "#0D1117", border: "1px solid #1C7ED6", color: "#C9D1D9" };
const L = "block text-xs font-semibold mb-1.5 uppercase tracking-wider";
const LS = { color: "#6E7681" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className={L} style={LS}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      className={I}
      style={focused ? IS_FOCUS : IS}
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function Textarea({ value, onChange, rows = 3, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      className={I}
      style={focused ? IS_FOCUS : IS}
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

const SEVERITY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  critical: { bg: "#3D1515", color: "#F87171", border: "#7F1D1D" },
  high:     { bg: "#2D1A00", color: "#F59E0B", border: "#78350F" },
  notable:  { bg: "#0D2D1A", color: "#6EE7B7", border: "#166534" },
};

function KeyStatCard({ stat, idx, onChange, onRemove }: {
  stat: KeyStat; idx: number;
  onChange: (idx: number, field: keyof KeyStat, val: string) => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div className="rounded-lg p-4 relative" style={{ background: "#0D1117", border: "1px solid #30363D" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#484F58" }}>Stat #{idx + 1}</span>
        <button onClick={() => onRemove(idx)} className="text-xs px-2 py-1 rounded" style={{ color: "#F87171", background: "#3D1515" }}>Remove</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Number / Value">
          <Input value={stat.num} onChange={v => onChange(idx, "num", v)} placeholder="e.g. 12,000" />
        </Field>
        <Field label="Label">
          <Input value={stat.label} onChange={v => onChange(idx, "label", v)} placeholder="e.g. Students enrolled" />
        </Field>
      </div>
    </div>
  );
}

function IssueCard({ issue, idx, onChange, onRemove }: {
  issue: Issue; idx: number;
  onChange: (idx: number, field: keyof Issue, val: string) => void;
  onRemove: (idx: number) => void;
}) {
  const sev = SEVERITY_COLORS[issue.severity] ?? SEVERITY_COLORS.notable;
  return (
    <div className="rounded-lg p-4" style={{ background: "#0D1117", border: `1px solid #30363D`, borderLeft: `3px solid ${sev.color}` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#484F58" }}>Issue #{idx + 1}</span>
        <button onClick={() => onRemove(idx)} className="text-xs px-2 py-1 rounded" style={{ color: "#F87171", background: "#3D1515" }}>Remove</button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="Title">
          <Input value={issue.title} onChange={v => onChange(idx, "title", v)} placeholder="e.g. Anxiety" />
        </Field>
        <Field label="Severity">
          <select
            className={I} style={IS}
            value={issue.severity}
            onChange={e => onChange(idx, "severity", e.target.value)}
          >
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="notable">Notable</option>
          </select>
        </Field>
      </div>
      <Field label="Key Stat">
        <Input value={issue.stat} onChange={v => onChange(idx, "stat", v)} placeholder="e.g. 1 in 5 students" />
      </Field>
      <Field label="Description">
        <Textarea rows={2} value={issue.desc} onChange={v => onChange(idx, "desc", v)} placeholder="Brief description of this issue locally…" />
      </Field>
      <div className="mt-2">
        <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}>
          {issue.severity || "notable"}
        </span>
      </div>
    </div>
  );
}

function parseJsonArray<T>(raw: unknown, fallback: T[]): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === "string") {
    try { return JSON.parse(raw) as T[]; } catch { return fallback; }
  }
  return fallback;
}

export default function AreaEditForm({ area }: { area: Area }) {
  const router = useRouter();
  const [tab, setTab] = useState<"info" | "stats" | "issues" | "seo">("info");
  const [form, setForm] = useState({
    slug: area.slug ?? "",
    name: area.name ?? "",
    state: area.state ?? "",
    state_slug: area.state_slug ?? "",
    type: area.type ?? "city",
    population: area.population ?? "",
    schools: area.schools ?? "",
    overview: area.overview ?? "",
    prevention: area.prevention ?? "",
    seo_title: area.seo_title ?? "",
    seo_desc: area.seo_desc ?? "",
    og_image: area.og_image ?? "",
  });
  const [keyStats, setKeyStats] = useState<KeyStat[]>(
    parseJsonArray<KeyStat>(area.key_stats, [])
  );
  const [issues, setIssues] = useState<Issue[]>(
    parseJsonArray<Issue>(area.issues, [])
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
    setSuccess(false);
  }

  function updateStat(idx: number, field: keyof KeyStat, val: string) {
    setKeyStats(s => s.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  }
  function removeStat(idx: number) { setKeyStats(s => s.filter((_, i) => i !== idx)); }
  function addStat() { setKeyStats(s => [...s, { num: "", label: "" }]); }

  function updateIssue(idx: number, field: keyof Issue, val: string) {
    setIssues(s => s.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  }
  function removeIssue(idx: number) { setIssues(s => s.filter((_, i) => i !== idx)); }
  function addIssue() { setIssues(s => [...s, { title: "", severity: "notable", stat: "", desc: "" }]); }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess(false);
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
      key_stats: keyStats,
      issues: issues,
      prevention: form.prevention.trim(),
      seo_title: form.seo_title.trim(),
      seo_desc: form.seo_desc.trim(),
      og_image: form.og_image.trim(),
    }).eq("id", area.id);
    if (err) { setError(err.message); } else { setSuccess(true); router.refresh(); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${area.name}"? This cannot be undone.`)) return;
    const sb = createClient();
    await sb.from("areas").delete().eq("id", area.id);
    router.push("/admin/content");
  }

  const TABS = [
    { id: "info",   label: "Basic Info",    count: null },
    { id: "stats",  label: "Key Stats",     count: keyStats.length },
    { id: "issues", label: "Local Issues",  count: issues.length },
    { id: "seo",    label: "SEO",           count: null },
  ] as const;

  return (
    <div className="max-w-4xl">
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: "#161B22", border: "1px solid #21262D" }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center"
            style={tab === t.id
              ? { background: "#1C7ED6", color: "#fff" }
              : { background: "transparent", color: "#6E7681" }
            }
          >
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
            <Field label="Name">
              <Input value={form.name} onChange={v => set("name", v)} placeholder="e.g. Northern Beaches" />
            </Field>
            <Field label="Type">
              <select className={I} style={IS} value={form.type} onChange={e => set("type", e.target.value)}>
                <option value="city">City</option>
                <option value="region">Region</option>
                <option value="lga">LGA</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-1">
            <Field label="State">
              <Input value={form.state} onChange={v => set("state", v)} placeholder="e.g. New South Wales" />
            </Field>
            <Field label="State Slug">
              <Input value={form.state_slug} onChange={v => set("state_slug", v)} placeholder="e.g. new-south-wales" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-1">
            <Field label="Population">
              <Input value={form.population} onChange={v => set("population", v)} placeholder="e.g. 280,000" />
            </Field>
            <Field label="Schools">
              <Input value={form.schools} onChange={v => set("schools", v)} placeholder="e.g. 120" />
            </Field>
          </div>
          <Field label="URL Slug">
            <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid #30363D" }}>
              <span className="px-3 py-2 text-xs flex-shrink-0" style={{ background: "#21262D", color: "#484F58", borderRight: "1px solid #30363D" }}>/areas/</span>
              <input className="flex-1 px-3 py-2 text-sm outline-none" style={{ background: "#0D1117", color: "#C9D1D9", border: "none" }}
                value={form.slug} onChange={e => set("slug", e.target.value)} />
            </div>
          </Field>
          <Field label="Overview">
            <Textarea rows={4} value={form.overview} onChange={v => set("overview", v)} placeholder="Brief description of this area and its student wellbeing context…" />
          </Field>
          <Field label="Prevention Insight">
            <Textarea rows={3} value={form.prevention} onChange={v => set("prevention", v)} placeholder="What prevention or support systems are in place locally…" />
          </Field>
        </div>
      )}

      {/* ── Tab: Key Stats ── */}
      {tab === "stats" && (
        <div className="space-y-3">
          <div className="rounded-xl px-5 py-4 flex items-center justify-between" style={{ background: "#161B22", border: "1px solid #21262D" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#E6EDF3" }}>Key Statistics</p>
              <p className="text-xs mt-0.5" style={{ color: "#484F58" }}>Headline numbers shown on the area page (population, schools, etc.)</p>
            </div>
            <button onClick={addStat} className="text-sm font-semibold px-4 py-2 rounded-lg flex-shrink-0"
              style={{ background: "#1C7ED630", color: "#58A6FF", border: "1px solid #1C7ED640" }}>
              + Add Stat
            </button>
          </div>
          {keyStats.length === 0 && (
            <div className="rounded-xl p-10 text-center" style={{ background: "#161B22", border: "1px dashed #30363D" }}>
              <p className="text-sm mb-3" style={{ color: "#484F58" }}>No stats yet</p>
              <button onClick={addStat} className="text-sm font-semibold px-4 py-2 rounded-lg"
                style={{ background: "#21262D", color: "#C9D1D9" }}>Add first stat</button>
            </div>
          )}
          {keyStats.map((stat, idx) => (
            <KeyStatCard key={idx} stat={stat} idx={idx} onChange={updateStat} onRemove={removeStat} />
          ))}
        </div>
      )}

      {/* ── Tab: Local Issues ── */}
      {tab === "issues" && (
        <div className="space-y-3">
          <div className="rounded-xl px-5 py-4 flex items-center justify-between" style={{ background: "#161B22", border: "1px solid #21262D" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#E6EDF3" }}>Local Wellbeing Issues</p>
              <p className="text-xs mt-0.5" style={{ color: "#484F58" }}>Priority issues specific to this area — shown as cards on the area page</p>
            </div>
            <button onClick={addIssue} className="text-sm font-semibold px-4 py-2 rounded-lg flex-shrink-0"
              style={{ background: "#238636", color: "#FFFFFF" }}>
              + Add Issue
            </button>
          </div>
          {issues.length === 0 && (
            <div className="rounded-xl p-10 text-center" style={{ background: "#161B22", border: "1px dashed #30363D" }}>
              <p className="text-sm mb-3" style={{ color: "#484F58" }}>No issues added yet</p>
              <button onClick={addIssue} className="text-sm font-semibold px-4 py-2 rounded-lg"
                style={{ background: "#21262D", color: "#C9D1D9" }}>Add first issue</button>
            </div>
          )}
          {issues.map((issue, idx) => (
            <IssueCard key={idx} issue={issue} idx={idx} onChange={updateIssue} onRemove={removeIssue} />
          ))}
        </div>
      )}

      {/* ── Tab: SEO ── */}
      {tab === "seo" && (
        <SeoPanel
          seoTitle={form.seo_title}
          seoDesc={form.seo_desc}
          ogImage={form.og_image}
          defaultTitle={`${form.name}, ${form.state} — Wellbeing Data`}
          defaultDesc={form.overview}
          onChange={(field, value) => set(field, value)}
        />
      )}

      {/* Status messages */}
      {error && (
        <div className="mt-5 px-4 py-3 rounded-lg text-sm" style={{ background: "#3D1515", color: "#F87171", border: "1px solid #7F1D1D" }}>
          {error}
        </div>
      )}
      {success && (
        <div className="mt-5 px-4 py-3 rounded-lg text-sm flex items-center gap-2" style={{ background: "#0D2D1A", color: "#6EE7B7", border: "1px solid #166534" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Saved successfully
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-3 mt-5 pt-5" style={{ borderTop: "1px solid #21262D" }}>
        <button onClick={handleSave} disabled={saving}
          className="text-sm font-semibold px-5 py-2 rounded-lg flex items-center gap-2"
          style={{ background: saving ? "#21262D" : "#238636", color: "#FFFFFF", opacity: saving ? 0.6 : 1 }}>
          {saving ? (
            <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg> Saving…</>
          ) : (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Save Changes</>
          )}
        </button>
        <a href={`/areas/${form.slug}`} target="_blank" rel="noopener noreferrer"
          className="text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
          style={{ background: "#21262D", color: "#8B949E" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          View
        </a>
        <button onClick={() => router.push("/admin/content")}
          className="text-sm font-semibold px-4 py-2 rounded-lg"
          style={{ background: "transparent", color: "#6E7681" }}>
          ← Back
        </button>
        <button onClick={handleDelete}
          className="text-sm font-semibold px-4 py-2 rounded-lg ml-auto"
          style={{ background: "#3D1515", color: "#F87171", border: "1px solid #7F1D1D" }}>
          Delete Area
        </button>
      </div>
    </div>
  );
}
