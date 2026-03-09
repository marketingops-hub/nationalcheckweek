"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SeoPanel from "@/components/admin/SeoPanel";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { useRegenerate } from "@/components/admin/useRegenerate";

interface StateIssue { name: string; badge: string; stat: string; desc: string; }

interface State {
  id: string; slug: string; name: string; icon: string; subtitle: string;
  issues: StateIssue[];
  seo_title?: string; seo_desc?: string; og_image?: string;
}

const I = "w-full rounded-xl px-4 py-2.5 text-[15px] outline-none transition-all";
const IS: React.CSSProperties = { background: "#fff", border: "1px solid var(--admin-border-strong)", color: "var(--admin-text-primary)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" };
const L = "block text-xs font-semibold mb-2 uppercase tracking-wider";
const LS: React.CSSProperties = { color: "var(--admin-text-subtle)" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-4"><label className={L} style={LS}>{label}</label>{children}</div>;
}

function parseJsonArray<T>(raw: unknown, fallback: T[]): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return fallback; } }
  return fallback;
}

const BADGE_OPTIONS = [
  { value: "badge-critical", label: "Critical", cssClass: "admin-badge-red" },
  { value: "badge-high",     label: "High",     cssClass: "admin-badge-yellow" },
  { value: "badge-notable",  label: "Notable",  cssClass: "admin-badge-green" },
];

const BADGE_LEFT: Record<string, string> = {
  "badge-critical": "var(--admin-danger-light)",
  "badge-high":     "var(--admin-warning-light)",
  "badge-notable":  "var(--admin-success-light)",
};

function StateIssueCard({ issue, idx, onChange, onRemove }: {
  issue: StateIssue; idx: number;
  onChange: (idx: number, field: keyof StateIssue, val: string) => void;
  onRemove: (idx: number) => void;
}) {
  const leftColor = BADGE_LEFT[issue.badge] ?? BADGE_LEFT["badge-notable"];
  const badgeOpt = BADGE_OPTIONS.find(b => b.value === issue.badge) ?? BADGE_OPTIONS[2];
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--admin-bg-elevated)", border: "1px solid var(--admin-border)", borderLeft: `3px solid ${leftColor}` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--admin-text-faint)" }}>Issue #{idx + 1}</span>
        <button onClick={() => onRemove(idx)} className="admin-btn admin-btn-danger text-xs px-2.5 py-1">Remove</button>
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
      <span className={`admin-badge ${badgeOpt.cssClass} mt-2`}>{badgeOpt.label}</span>
    </div>
  );
}

/** Small spinner+label button used to trigger AI re-generation for one section. */
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

export default function StateEditForm({ state }: { state: State | null }) {
  const router = useRouter();
  const isNew = !state;
  const [tab, setTab] = useState<"info" | "issues" | "seo">("info");
  const [dirty, setDirty] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const regen = useRegenerate();

  const [form, setForm] = useState({
    slug: state?.slug ?? "", name: state?.name ?? "", icon: state?.icon ?? "",
    subtitle: state?.subtitle ?? "",
    seo_title: state?.seo_title ?? "", seo_desc: state?.seo_desc ?? "", og_image: state?.og_image ?? "",
  });
  const [issues, setIssues] = useState<StateIssue[]>(parseJsonArray<StateIssue>(state?.issues, []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
    setDirty(true); setSuccess(false);
  }

  function updateIssue(idx: number, field: keyof StateIssue, val: string) {
    setIssues(s => s.map((item, i) => i === idx ? { ...item, [field]: val } : item));
    setDirty(true);
  }
  function removeIssue(idx: number) { setIssues(s => s.filter((_, i) => i !== idx)); setDirty(true); }
  function addIssue() { setIssues(s => [...s, { name: "", badge: "badge-notable", stat: "", desc: "" }]); setDirty(true); }

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!form.slug.trim()) { setError("Slug is required."); return; }
    setSaving(true); setError(""); setSuccess(false);
    const sb = createClient();
    const payload = {
      slug: form.slug.trim(), name: form.name.trim(), icon: form.icon.trim(),
      subtitle: form.subtitle.trim(), issues,
      seo_title: form.seo_title.trim(), seo_desc: form.seo_desc.trim(), og_image: form.og_image.trim(),
    };
    if (isNew) {
      const { data, error: err } = await sb.from("states").insert(payload).select("id").single();
      if (err) { setError(err.message); } else if (data) { router.push(`/admin/states/${data.id}`); router.refresh(); return; }
    } else {
      const { error: err } = await sb.from("states").update(payload).eq("id", state!.id);
      if (err) { setError(err.message); } else { setSuccess(true); setDirty(false); router.refresh(); }
    }
    setSaving(false);
  }, [form, issues, isNew, state, router]);

  async function handleDelete() {
    if (!state) return;
    const sb = createClient();
    await sb.from("states").delete().eq("id", state.id);
    router.push("/admin/states"); router.refresh();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); handleSave(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave]);

  /** Apply generated content into form/issues state. */
  async function handleRegen(sectionKeys?: string[]) {
    if (!state?.id) { regen.setError("Save the state first before generating content."); return; }
    const result = await regen.generate("state", state.id, sectionKeys);
    if (!result) return;
    const u = result.updated;
    if (u.subtitle   && typeof u.subtitle === "string")  { setForm(f => ({ ...f, subtitle: u.subtitle as string })); setDirty(true); }
    if (u.seo_title  && typeof u.seo_title === "string")  { setForm(f => ({ ...f, seo_title: u.seo_title as string })); setDirty(true); }
    if (u.seo_desc   && typeof u.seo_desc === "string")   { setForm(f => ({ ...f, seo_desc: u.seo_desc as string })); setDirty(true); }
    if (Array.isArray(u.issues)) { setIssues(u.issues as typeof issues); setDirty(true); }
  }

  const TABS = [
    { id: "info",   label: "Basic Info",      count: null },
    { id: "issues", label: "Priority Issues", count: issues.length },
    { id: "seo",    label: "SEO",             count: null },
  ] as const;

  return (
    <div className="max-w-4xl">
      <ConfirmModal open={showDeleteModal} title="Delete this state?"
        message={`"${state?.name}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete State" onConfirm={handleDelete} onCancel={() => setShowDeleteModal(false)} />

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
            <Field label="Icon (emoji)"><input className={I} style={IS} value={form.icon} onChange={e => set("icon", e.target.value)} placeholder="🏫" /></Field>
            <Field label="Slug"><input className={I} style={IS} value={form.slug} onChange={e => set("slug", e.target.value)} placeholder="e.g. nsw" /></Field>
          </div>
          <Field label="Name">
            <input className={I} style={{ ...IS, fontSize: "1rem", fontWeight: 600 }} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. New South Wales" />
          </Field>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className={L} style={{ ...LS, margin: 0 }}>Subtitle</label>
              {!isNew && <RegenBtn label="Subtitle" onClick={() => handleRegen(["subtitle"])} busy={regen.busy === "subtitle"} />}
            </div>
            <input className={I} style={IS} value={form.subtitle} onChange={e => set("subtitle", e.target.value)} placeholder="e.g. Key wellbeing challenges for NSW schools" />
          </div>
        </div>
      )}

      {/* ── Tab: Priority Issues ── */}
      {tab === "issues" && (
        <div className="admin-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "var(--admin-text-primary)" }}>Priority Issues</h2>
              <p className="text-xs mt-1" style={{ color: "var(--admin-text-subtle)" }}>Top wellbeing issues for this state/territory</p>
            </div>
            <div className="flex items-center gap-2">
              {!isNew && <RegenBtn label="All Issues" onClick={() => handleRegen(["issues"])} busy={regen.busy === "issues"} />}
              <button onClick={addIssue} className="admin-btn admin-btn-primary text-xs">+ Add Issue</button>
            </div>
          </div>
          {issues.length === 0 ? (
            <div className="rounded-xl p-8 text-center" style={{ border: "2px dashed var(--admin-border)" }}>
              <p className="text-xs" style={{ color: "var(--admin-text-faint)" }}>No priority issues yet — click &quot;Add Issue&quot; to add one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map((iss, idx) => <StateIssueCard key={idx} issue={iss} idx={idx} onChange={updateIssue} onRemove={removeIssue} />)}
            </div>
          )}
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
            defaultTitle={`${form.name} — Wellbeing Data`} defaultDesc={form.subtitle}
            onChange={(field, value) => set(field, value)} />
        </>
      )}

      {/* Actions bar */}
      <div className="mt-8">
        {error && <div className="admin-alert admin-alert-error mb-4">{error}</div>}
        {success && (
          <div className="admin-alert admin-alert-success mb-4 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Saved successfully
          </div>
        )}
        <div className="flex items-center gap-3 pt-6" style={{ borderTop: "1px solid var(--admin-border)" }}>
          <button onClick={handleSave} disabled={saving} className="admin-btn admin-btn-primary" style={{ minWidth: "130px", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : isNew ? "Create State" : "Save Changes"}
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
              <a href={`/states/${form.slug}`} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-secondary">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                View
              </a>
            )}
            <button onClick={() => router.push("/admin/states")} className="admin-btn admin-btn-ghost">← Back</button>
            {!isNew && <button onClick={() => setShowDeleteModal(true)} className="admin-btn admin-btn-danger">Delete</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
