"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SeoPanel from "@/components/admin/SeoPanel";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { useRegenerate } from "@/components/admin/useRegenerate";

interface KeyStat { num: string; label: string; }
interface Issue { title: string; severity: string; stat: string; desc: string; }

interface Area {
  id: string; slug: string; name: string; state: string; state_slug: string;
  type: string; population: string; schools: string; overview: string;
  key_stats: unknown; issues: unknown; prevention: string;
  seo_title?: string; seo_desc?: string; og_image?: string;
}

const I = "w-full rounded-xl px-4 py-2.5 text-[15px] outline-none transition-all";
const IS: React.CSSProperties = { background: "#fff", border: "1px solid var(--admin-border-strong)", color: "var(--admin-text-primary)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" };
const L = "block text-xs font-semibold mb-2 uppercase tracking-wider";
const LS: React.CSSProperties = { color: "var(--admin-text-subtle)" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-4"><label className={L} style={LS}>{label}</label>{children}</div>;
}

const SEVERITY_LEFT: Record<string, string> = {
  critical: "var(--admin-danger)",
  high:     "var(--admin-warning-light)",
  notable:  "var(--admin-success)",
};

function KeyStatCard({ stat, idx, onChange, onRemove }: {
  stat: KeyStat; idx: number;
  onChange: (idx: number, field: keyof KeyStat, val: string) => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--admin-bg-elevated)", border: "1px solid var(--admin-border)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--admin-text-faint)" }}>Stat #{idx + 1}</span>
        <button onClick={() => onRemove(idx)} className="admin-btn admin-btn-danger text-xs px-2.5 py-1">Remove</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Number / Value">
          <input className={I} style={IS} value={stat.num} onChange={e => onChange(idx, "num", e.target.value)} placeholder="e.g. 12,000" />
        </Field>
        <Field label="Label">
          <input className={I} style={IS} value={stat.label} onChange={e => onChange(idx, "label", e.target.value)} placeholder="e.g. Students enrolled" />
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
  const leftColor = SEVERITY_LEFT[issue.severity] ?? SEVERITY_LEFT.notable;
  return (
    <div className="rounded-xl p-5" style={{ background: "var(--admin-bg-deep)", border: "1px solid var(--admin-border-strong)", borderLeft: `3px solid ${leftColor}` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--admin-text-faint)" }}>Issue #{idx + 1}</span>
        <button onClick={() => onRemove(idx)} className="admin-btn admin-btn-danger text-xs px-2.5 py-1">Remove</button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="Title">
          <input className={I} style={IS} value={issue.title} onChange={e => onChange(idx, "title", e.target.value)} placeholder="e.g. Anxiety" />
        </Field>
        <Field label="Severity">
          <select className={I} style={IS} value={issue.severity} onChange={e => onChange(idx, "severity", e.target.value)}>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="notable">Notable</option>
          </select>
        </Field>
      </div>
      <Field label="Key Stat">
        <input className={I} style={IS} value={issue.stat} onChange={e => onChange(idx, "stat", e.target.value)} placeholder="e.g. 1 in 5 students" />
      </Field>
      <Field label="Description">
        <textarea rows={2} className={I} style={{ ...IS, resize: "vertical" }} value={issue.desc} onChange={e => onChange(idx, "desc", e.target.value)} placeholder="Brief description of this issue locally…" />
      </Field>
      <div className="mt-2">
        <span className={`admin-badge ${issue.severity === "critical" ? "admin-badge-red" : issue.severity === "high" ? "admin-badge-yellow" : "admin-badge-green"}`}>
          {issue.severity || "notable"}
        </span>
      </div>
    </div>
  );
}

function parseJsonArray<T>(raw: unknown, fallback: T[]): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === "string") { try { return JSON.parse(raw) as T[]; } catch { return fallback; } }
  return fallback;
}

/** Small re-generate button shown inline next to section labels. */
function RegenBtn({ label, onClick, busy }: { label: string; onClick: () => void; busy: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="admin-btn admin-btn-secondary text-xs flex items-center gap-1.5"
      style={{ opacity: busy ? 0.6 : 1 }}
      title={`Re-generate ${label} with AI`}
    >
      {busy
        ? <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
        : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.01"/></svg>
      }
      {busy ? "Generating…" : `↺ ${label}`}
    </button>
  );
}

export default function AreaEditForm({ area }: { area: Area | null }) {
  const router = useRouter();
  const isNew = !area;
  const [tab, setTab] = useState<"info" | "stats" | "issues" | "seo">("info");
  const [dirty, setDirty] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const regen = useRegenerate();

  const [form, setForm] = useState({
    slug: area?.slug ?? "", name: area?.name ?? "", state: area?.state ?? "",
    state_slug: area?.state_slug ?? "", type: area?.type ?? "city",
    population: area?.population ?? "", schools: area?.schools ?? "",
    overview: area?.overview ?? "", prevention: area?.prevention ?? "",
    seo_title: area?.seo_title ?? "", seo_desc: area?.seo_desc ?? "", og_image: area?.og_image ?? "",
  });
  const [keyStats, setKeyStats] = useState<KeyStat[]>(parseJsonArray<KeyStat>(area?.key_stats, []));
  const [issues, setIssues] = useState<Issue[]>(parseJsonArray<Issue>(area?.issues, []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
    setDirty(true); setSuccess(false);
  }

  function updateStat(idx: number, field: keyof KeyStat, val: string) {
    setKeyStats(s => s.map((item, i) => i === idx ? { ...item, [field]: val } : item));
    setDirty(true);
  }
  function removeStat(idx: number) { setKeyStats(s => s.filter((_, i) => i !== idx)); setDirty(true); }
  function addStat() { setKeyStats(s => [...s, { num: "", label: "" }]); setDirty(true); }

  function updateIssue(idx: number, field: keyof Issue, val: string) {
    setIssues(s => s.map((item, i) => i === idx ? { ...item, [field]: val } : item));
    setDirty(true);
  }
  function removeIssue(idx: number) { setIssues(s => s.filter((_, i) => i !== idx)); setDirty(true); }
  function addIssue() { setIssues(s => [...s, { title: "", severity: "notable", stat: "", desc: "" }]); setDirty(true); }

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!form.slug.trim()) { setError("Slug is required."); return; }
    setSaving(true); setError(""); setSuccess(false);
    const sb = createClient();
    const payload = {
      slug: form.slug.trim(), name: form.name.trim(), state: form.state.trim(),
      state_slug: form.state_slug.trim(), type: form.type,
      population: form.population.trim(), schools: form.schools.trim(),
      overview: form.overview.trim(), key_stats: keyStats, issues,
      prevention: form.prevention.trim(), seo_title: form.seo_title.trim(),
      seo_desc: form.seo_desc.trim(), og_image: form.og_image.trim(),
    };
    if (isNew) {
      const { data, error: err } = await sb.from("areas").insert(payload).select("id").single();
      if (err) { setError(err.message); } else if (data) { router.push(`/admin/content/${data.id}`); router.refresh(); return; }
    } else {
      const { error: err } = await sb.from("areas").update(payload).eq("id", area!.id);
      if (err) { setError(err.message); } else { setSuccess(true); setDirty(false); router.refresh(); }
    }
    setSaving(false);
  }, [form, keyStats, issues, isNew, area, router]);

  async function handleDelete() {
    if (!area) return;
    const sb = createClient();
    await sb.from("areas").delete().eq("id", area.id);
    router.push("/admin/content");
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); handleSave(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave]);

  /** Apply AI-generated content into local form/array state. */
  async function handleRegen(sectionKeys?: string[]) {
    if (!area?.id) { regen.setError("Save the area first before generating content."); return; }
    const result = await regen.generate("area", area.id, sectionKeys);
    if (!result) return;
    const u = result.updated;
    if (u.overview    && typeof u.overview === "string")    { setForm(f => ({ ...f, overview: u.overview as string })); setDirty(true); }
    if (u.prevention  && typeof u.prevention === "string")  { setForm(f => ({ ...f, prevention: u.prevention as string })); setDirty(true); }
    if (u.seo_title   && typeof u.seo_title === "string")   { setForm(f => ({ ...f, seo_title: u.seo_title as string })); setDirty(true); }
    if (u.seo_desc    && typeof u.seo_desc === "string")    { setForm(f => ({ ...f, seo_desc: u.seo_desc as string })); setDirty(true); }
    if (Array.isArray(u.issues))    { setIssues(u.issues as Issue[]); setDirty(true); }
    if (Array.isArray(u.key_stats)) { setKeyStats(u.key_stats as KeyStat[]); setDirty(true); }
  }

  const TABS = [
    { id: "info",   label: "Basic Info",   count: null },
    { id: "stats",  label: "Key Stats",    count: keyStats.length },
    { id: "issues", label: "Local Issues", count: issues.length },
    { id: "seo",    label: "SEO",          count: null },
  ] as const;

  return (
    <div className="max-w-4xl">
      <ConfirmModal
        open={showDeleteModal}
        title="Delete this area?"
        message={`"${area?.name}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete Area"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Tab bar */}
      <div className="flex gap-1 mb-8 p-1 rounded-xl" style={{ background: "var(--admin-bg-elevated)", border: "1px solid var(--admin-border)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium flex-1 justify-center"
            style={tab === t.id
              ? { background: "#fff", color: "var(--admin-text-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
              : { background: "transparent", color: "var(--admin-text-subtle)" }}>
            {t.label}
            {t.count !== null && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                style={tab === t.id
                  ? { background: "var(--admin-accent-bg)", color: "var(--admin-accent)" }
                  : { background: "var(--admin-border)", color: "var(--admin-text-subtle)" }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Regen feedback ── */}
      {regen.error   && <div className="admin-alert admin-alert-error mb-5" role="alert">{regen.error}</div>}
      {regen.success && <div className="admin-alert admin-alert-success mb-5" role="status">{regen.success}</div>}

      {/* ── Tab: Basic Info ── */}
      {tab === "info" && (
        <div className="admin-card">
          <div className="grid grid-cols-2 gap-5 mb-1">
            <Field label="Name"><input className={I} style={IS} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Northern Beaches" /></Field>
            <Field label="Type">
              <select className={I} style={IS} value={form.type} onChange={e => set("type", e.target.value)}>
                <option value="city">City</option><option value="region">Region</option><option value="lga">LGA</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-5 mb-1">
            <Field label="State"><input className={I} style={IS} value={form.state} onChange={e => set("state", e.target.value)} placeholder="e.g. New South Wales" /></Field>
            <Field label="State Slug"><input className={I} style={IS} value={form.state_slug} onChange={e => set("state_slug", e.target.value)} placeholder="e.g. new-south-wales" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-5 mb-1">
            <Field label="Population"><input className={I} style={IS} value={form.population} onChange={e => set("population", e.target.value)} placeholder="e.g. 280,000" /></Field>
            <Field label="Schools"><input className={I} style={IS} value={form.schools} onChange={e => set("schools", e.target.value)} placeholder="e.g. 120" /></Field>
          </div>
          <Field label="URL Slug">
            <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "1px solid var(--admin-border-strong)" }}>
              <span className="px-4 py-2.5 text-xs font-medium flex-shrink-0" style={{ background: "var(--admin-bg-elevated)", color: "var(--admin-text-subtle)", borderRight: "1px solid var(--admin-border-strong)" }}>/areas/</span>
              <input className="flex-1 px-4 py-2.5 text-[15px] outline-none" style={{ background: "var(--admin-bg-deep)", color: "var(--admin-text-secondary)", border: "none" }}
                value={form.slug} onChange={e => set("slug", e.target.value)} />
            </div>
          </Field>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className={L} style={{ ...LS, margin: 0 }}>Overview</label>
              {!isNew && <RegenBtn label="Overview" onClick={() => handleRegen(["overview"])} busy={regen.busy === "overview"} />}
            </div>
            <textarea rows={4} className={I} style={{ ...IS, resize: "vertical" }} value={form.overview} onChange={e => set("overview", e.target.value)} placeholder="Brief description of this area and its student wellbeing context…" />
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className={L} style={{ ...LS, margin: 0 }}>Prevention Insight</label>
              {!isNew && <RegenBtn label="Prevention" onClick={() => handleRegen(["prevention"])} busy={regen.busy === "prevention"} />}
            </div>
            <textarea rows={3} className={I} style={{ ...IS, resize: "vertical" }} value={form.prevention} onChange={e => set("prevention", e.target.value)} placeholder="What prevention or support systems are in place locally…" />
          </div>
        </div>
      )}

      {/* ── Tab: Key Stats ── */}
      {tab === "stats" && (
        <div className="space-y-3">
          <div className="admin-card flex items-center justify-between py-5">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--admin-text-primary)" }}>Key Statistics</p>
              <p className="text-xs mt-1" style={{ color: "var(--admin-text-subtle)" }}>Headline numbers shown on the area page</p>
            </div>
            <div className="flex items-center gap-2">
              {!isNew && <RegenBtn label="Key Stats" onClick={() => handleRegen(["key_stats"])} busy={regen.busy === "key_stats"} />}
              <button onClick={addStat} className="admin-btn admin-btn-secondary flex-shrink-0">+ Add Stat</button>
            </div>
          </div>
          {keyStats.length === 0 && (
            <div className="admin-empty" style={{ border: "2px dashed var(--admin-border)" }}>
              <p className="text-sm" style={{ color: "var(--admin-text-faint)" }}>No stats yet</p>
              <button onClick={addStat} className="admin-btn admin-btn-secondary mt-3">Add first stat</button>
            </div>
          )}
          {keyStats.map((stat, idx) => <KeyStatCard key={idx} stat={stat} idx={idx} onChange={updateStat} onRemove={removeStat} />)}
        </div>
      )}

      {/* ── Tab: Local Issues ── */}
      {tab === "issues" && (
        <div className="space-y-3">
          <div className="admin-card flex items-center justify-between py-5">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--admin-text-primary)" }}>Local Wellbeing Issues</p>
              <p className="text-xs mt-1" style={{ color: "var(--admin-text-subtle)" }}>Priority issues specific to this area</p>
            </div>
            <div className="flex items-center gap-2">
              {!isNew && <RegenBtn label="All Issues" onClick={() => handleRegen(["issues"])} busy={regen.busy === "issues"} />}
              <button onClick={addIssue} className="admin-btn admin-btn-primary flex-shrink-0">+ Add Issue</button>
            </div>
          </div>
          {issues.length === 0 && (
            <div className="admin-empty" style={{ border: "2px dashed var(--admin-border)" }}>
              <p className="text-sm" style={{ color: "var(--admin-text-faint)" }}>No issues added yet</p>
              <button onClick={addIssue} className="admin-btn admin-btn-secondary mt-3">Add first issue</button>
            </div>
          )}
          {issues.map((issue, idx) => <IssueCard key={idx} issue={issue} idx={idx} onChange={updateIssue} onRemove={removeIssue} />)}
        </div>
      )}

      {/* ── Tab: SEO ── */}
      {tab === "seo" && (
        <>
          {!isNew && (
            <div className="flex gap-2 mb-4">
              <RegenBtn label="SEO Title" onClick={() => handleRegen(["seo_title"])} busy={regen.busy === "seo_title"} />
              <RegenBtn label="SEO Description" onClick={() => handleRegen(["seo_desc"])} busy={regen.busy === "seo_desc"} />
            </div>
          )}
          <SeoPanel seoTitle={form.seo_title} seoDesc={form.seo_desc} ogImage={form.og_image}
            defaultTitle={`${form.name}, ${form.state} — Wellbeing Data`} defaultDesc={form.overview}
            onChange={(field, value) => set(field, value)} />
        </>
      )}

      {/* Status messages */}
      {error && <div className="admin-alert admin-alert-error mt-5">{error}</div>}
      {success && (
        <div className="admin-alert admin-alert-success mt-5 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Saved successfully
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-3 mt-6 pt-6" style={{ borderTop: "1px solid var(--admin-border)" }}>
        <button onClick={handleSave} disabled={saving} className="admin-btn admin-btn-primary" style={{ minWidth: "130px", background: saving ? "var(--admin-bg-elevated)" : undefined, opacity: saving ? 0.7 : 1 }}>
          {saving ? <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg> Saving…</> : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Save Changes</>}
        </button>
        {!isNew && (
          <RegenBtn
            label="Re-generate All"
            onClick={() => handleRegen()}
            busy={regen.busy === "all"}
          />
        )}
        {dirty && !saving && (
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--admin-warning-light)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--admin-warning-light)" }} />
            Unsaved changes
          </span>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {!isNew && (
            <a href={`/areas/${form.slug}`} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-secondary">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              View
            </a>
          )}
          <button onClick={() => router.push("/admin/content")} className="admin-btn admin-btn-ghost">← Back</button>
          {!isNew && (
            <button onClick={() => setShowDeleteModal(true)} className="admin-btn admin-btn-danger">Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}
