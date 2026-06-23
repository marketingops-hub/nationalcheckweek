"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SeoPanel from "@/components/admin/SeoPanel";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { useRegenerate } from "@/components/admin/useRegenerate";
import RichTextEditor from "@/components/admin/RichTextEditor";
import RegenBtn from "@/components/admin/areas/RegenBtn";
import KeyStatCard from "@/components/admin/areas/KeyStatCard";
import AreaIssueCard from "@/components/admin/areas/AreaIssueCard";
import { type KeyStat, type AreaIssue, type GlobalIssue, INPUT_CLS, INPUT_STYLE, LABEL_CLS, LABEL_STYLE } from "@/components/admin/areas/AreaTypes";
import { adminFetch } from "@/lib/adminFetch";
import RewriteFromSource from "@/components/admin/RewriteFromSource";

interface Area {
  id: string; slug: string; name: string; state: string; state_slug: string;
  type: string; population: string; schools: string; overview: string;
  key_stats: unknown; issues: unknown; prevention: string;
  seo_title?: string; seo_desc?: string; og_image?: string;
}

const I = INPUT_CLS;
const IS = INPUT_STYLE;
const L = LABEL_CLS;
const LS = LABEL_STYLE;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-4"><label className={L} style={LS}>{label}</label>{children}</div>;
}

function parseJsonArray<T>(raw: unknown, fallback: T[]): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === "string") { try { return JSON.parse(raw) as T[]; } catch { return fallback; } }
  return fallback;
}

export default function AreaEditForm({ area }: { area: Area | null }) {
  const router = useRouter();
  const isNew = !area;
  const [tab, setTab] = useState<"info" | "stats" | "issues" | "seo" | "rewrite">("info");
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
  const [issues, setIssues] = useState<AreaIssue[]>(parseJsonArray<AreaIssue>(area?.issues, []));
  const [globalIssues, setGlobalIssues] = useState<GlobalIssue[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Local issues AI rewrite state
  const [vaultDocs, setVaultDocs] = useState<{ id: string; title: string; kind: string }[]>([]);
  const [loadingVault, setLoadingVault] = useState(false);
  const [issueRewriteDocId, setIssueRewriteDocId] = useState("");
  const [issueRewriting, setIssueRewriting] = useState(false);
  const [issueRewriteResult, setIssueRewriteResult] = useState<{ issues: AreaIssue[]; document_title: string } | null>(null);
  const [issueRewriteError, setIssueRewriteError] = useState("");
  const [showIssueRewrite, setShowIssueRewrite] = useState(false);

  useEffect(() => {
    const sb = createClient();
    sb.from("issues").select("slug, title").order("rank").then(({ data }) => {
      if (data) setGlobalIssues(data as GlobalIssue[]);
    });
  }, []);

  // Load vault docs when the issues rewrite panel is opened
  useEffect(() => {
    if (!showIssueRewrite || vaultDocs.length) return;
    setLoadingVault(true);
    adminFetch("/api/admin/vault/documents?status=ready&limit=100")
      .then(r => r.json())
      .then(d => setVaultDocs(d.documents ?? d.items ?? []))
      .catch(() => {})
      .finally(() => setLoadingVault(false));
  }, [showIssueRewrite, vaultDocs.length]);

  async function handleIssueRewrite() {
    if (!issueRewriteDocId || !area?.id) return;
    setIssueRewriting(true); setIssueRewriteError(""); setIssueRewriteResult(null);
    try {
      const res = await adminFetch("/api/admin/areas/rewrite-issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area_id: area.id, vault_document_id: issueRewriteDocId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Rewrite failed");
      setIssueRewriteResult(d);
    } catch (e) {
      setIssueRewriteError(e instanceof Error ? e.message : "Rewrite failed");
    } finally {
      setIssueRewriting(false);
    }
  }

  function applyIssueRewrite() {
    if (!issueRewriteResult) return;
    setIssues(issueRewriteResult.issues);
    setDirty(true);
    setIssueRewriteResult(null);
    setShowIssueRewrite(false);
    setIssueRewriteDocId("");
  }

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

  function updateIssue(idx: number, field: keyof AreaIssue, val: string) {
    setIssues(s => s.map((item, i) => i === idx ? { ...item, [field]: val } : item));
    setDirty(true);
  }
  function removeIssue(idx: number) { setIssues(s => s.filter((_, i) => i !== idx)); setDirty(true); }
  function addIssue() { setIssues(s => [...s, { title: "", severity: "notable", stat: "", desc: "" }]); setDirty(true); }

  async function handleAIGenerate() {
    if (!form.name || !form.state) {
      setError("Please enter area name and state first");
      return;
    }
    
    setGenerating(true);
    setError("");
    
    try {
      const res = await adminFetch('/api/admin/areas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          state: form.state,
          type: form.type,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }
      
      // Apply generated content
      if (data.overview) {
        setForm(f => ({ ...f, overview: data.overview }));
      }
      if (data.keyStats && Array.isArray(data.keyStats)) {
        setKeyStats(data.keyStats);
      }
      if (data.localIssues && Array.isArray(data.localIssues)) {
        setIssues(data.localIssues);
      }
      
      setDirty(true);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI generation failed');
    } finally {
      setGenerating(false);
    }
  }

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
    const { error: delErr } = await sb.from("areas").delete().eq("id", area.id);
    if (delErr) { setError(delErr.message); setShowDeleteModal(false); return; }
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
    if (Array.isArray(u.issues))    { setIssues(u.issues as AreaIssue[]); setDirty(true); }
    if (Array.isArray(u.key_stats)) { setKeyStats(u.key_stats as KeyStat[]); setDirty(true); }
  }

  const TABS = [
    { id: "info",    label: "Basic Info",   count: null },
    { id: "stats",   label: "Key Stats",    count: keyStats.length },
    { id: "issues",  label: "Local Issues", count: issues.length },
    { id: "seo",     label: "SEO",          count: null },
    { id: "rewrite", label: "AI Rewrite",   count: null },
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
          {isNew && (
            <div className="mb-6 p-4 rounded-lg" style={{ background: "var(--admin-accent-bg)", border: "1px solid var(--admin-accent)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: "var(--admin-text-primary)" }}>✨ AI Content Generation</h3>
                  <p className="text-sm" style={{ color: "var(--admin-text-subtle)" }}>Fill in the name and state, then click to generate overview, key stats, and local issues using OpenAI</p>
                </div>
                <button
                  onClick={handleAIGenerate}
                  disabled={generating || !form.name || !form.state}
                  className="px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
                  style={{
                    background: generating || !form.name || !form.state ? "var(--admin-border)" : "var(--admin-accent)",
                    color: "#fff",
                    opacity: generating || !form.name || !form.state ? 0.5 : 1,
                    cursor: generating || !form.name || !form.state ? "not-allowed" : "pointer",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    {generating ? "hourglass_empty" : "auto_awesome"}
                  </span>
                  {generating ? "Generating..." : "Generate with AI"}
                </button>
              </div>
            </div>
          )}
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
            <RichTextEditor
              value={form.overview}
              onChange={(v) => set("overview", v)}
              placeholder="Brief description of this area and its student wellbeing context…"
              minHeight={120}
            />
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className={L} style={{ ...LS, margin: 0 }}>Prevention Insight</label>
              {!isNew && <RegenBtn label="Prevention" onClick={() => handleRegen(["prevention"])} busy={regen.busy === "prevention"} />}
            </div>
            <RichTextEditor
              value={form.prevention}
              onChange={(v) => set("prevention", v)}
              placeholder="What prevention or support systems are in place locally…"
              minHeight={100}
            />
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
              {!isNew && (
                <button
                  onClick={() => { setShowIssueRewrite(v => { if (v) { setIssueRewriteDocId(""); setIssueRewriteResult(null); setIssueRewriteError(""); } return !v; }); }}
                  className="admin-btn admin-btn-secondary flex-shrink-0"
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>auto_awesome</span>
                  Rewrite from Doc
                </button>
              )}
              <button onClick={addIssue} className="admin-btn admin-btn-primary flex-shrink-0">+ Add Issue</button>
            </div>
          </div>

          {/* ── Rewrite from document panel ── */}
          {showIssueRewrite && !isNew && (
            <div style={{ background: "#f5f3ff", border: "1px solid #c4b5fd", borderRadius: 10, padding: "16px 18px" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#5b21b6", marginBottom: 4 }}>Rewrite Local Issues from Document</p>
              <p style={{ fontSize: 12, color: "#7c3aed", marginBottom: 12 }}>
                Select a Vault document — AI will rewrite the <strong>stat</strong> and <strong>description</strong> of each issue using it as a source, citing the document name for any statistics.
              </p>

              {loadingVault ? (
                <p style={{ fontSize: 12, color: "#9ca3af" }}>Loading vault…</p>
              ) : vaultDocs.length === 0 ? (
                <p style={{ fontSize: 12, color: "#9ca3af" }}>
                  No indexed documents yet.{" "}
                  <a href="/admin/vault/upload" target="_blank" style={{ color: "#7c3aed" }}>Upload one →</a>
                </p>
              ) : (
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <select
                    value={issueRewriteDocId}
                    onChange={e => { setIssueRewriteDocId(e.target.value); setIssueRewriteResult(null); setIssueRewriteError(""); }}
                    style={{ flex: "1 1 260px", padding: "7px 10px", borderRadius: 7, border: issueRewriteDocId ? "1.5px solid #7c3aed" : "1.5px solid #e5e7eb", fontSize: 13, background: "#fff" }}
                  >
                    <option value="">— choose a document —</option>
                    {vaultDocs.map(d => <option key={d.id} value={d.id}>{d.title} ({d.kind})</option>)}
                  </select>
                  <button
                    onClick={handleIssueRewrite}
                    disabled={!issueRewriteDocId || issueRewriting || issues.length === 0}
                    className="admin-btn admin-btn-primary"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {issueRewriting
                      ? <><span className="material-symbols-outlined" style={{ fontSize: 14, animation: "spin 1s linear infinite" }}>refresh</span> Rewriting…</>
                      : <><span className="material-symbols-outlined" style={{ fontSize: 14 }}>auto_awesome</span> Generate</>}
                  </button>
                </div>
              )}

              {issueRewriteError && (
                <p style={{ marginTop: 8, fontSize: 12, color: "#dc2626" }}>{issueRewriteError}</p>
              )}

              {issueRewriteResult && (
                <div style={{ marginTop: 12, padding: "12px 14px", background: "#fff", borderRadius: 8, border: "1px solid #c4b5fd" }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#5b21b6", marginBottom: 8 }}>
                    Preview — {issueRewriteResult.issues.length} issues rewritten from <em>{issueRewriteResult.document_title}</em>
                  </p>
                  {issueRewriteResult.issues.map((iss, i) => (
                    <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < issueRewriteResult.issues.length - 1 ? "1px solid #ede9fe" : "none" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{iss.title}</span>
                      {iss.stat && <span style={{ marginLeft: 8, fontSize: 11, color: "#7c3aed", background: "#ede9fe", padding: "1px 6px", borderRadius: 99 }}>{iss.stat}</span>}
                      <p style={{ fontSize: 12, color: "#4b5563", marginTop: 3, lineHeight: 1.5 }}>{iss.desc}</p>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={applyIssueRewrite} className="admin-btn admin-btn-primary" style={{ fontSize: 13 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
                      Apply to issues
                    </button>
                    <button onClick={() => setIssueRewriteResult(null)} className="admin-btn admin-btn-ghost" style={{ fontSize: 13 }}>Discard</button>
                  </div>
                  <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>Applying fills the form — you still need to save.</p>
                </div>
              )}
            </div>
          )}

          {issues.length === 0 && (
            <div className="admin-empty" style={{ border: "2px dashed var(--admin-border)" }}>
              <p className="text-sm" style={{ color: "var(--admin-text-faint)" }}>No issues added yet</p>
              <button onClick={addIssue} className="admin-btn admin-btn-secondary mt-3">Add first issue</button>
            </div>
          )}
          {issues.map((issue, idx) => <AreaIssueCard key={idx} issue={issue} idx={idx} onChange={updateIssue} onRemove={removeIssue} globalIssues={globalIssues} />)}
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

      {/* ── Tab: AI Rewrite ── */}
      {tab === "rewrite" && (
        <div className="mt-2">
          <RewriteFromSource
            recordType="area"
            recordId={area?.id ?? null}
            onApply={(fields) => {
              if (typeof fields.overview === "string")    set("overview",    fields.overview);
              if (typeof fields.prevention === "string")  set("prevention",  fields.prevention);
              if (Array.isArray(fields.key_stats))        { setKeyStats(fields.key_stats as KeyStat[]); setDirty(true); }
            }}
          />
        </div>
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
