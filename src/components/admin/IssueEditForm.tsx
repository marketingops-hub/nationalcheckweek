"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SeoPanel from "@/components/admin/SeoPanel";
import ConfirmModal from "@/components/admin/ConfirmModal";
import type { IssueSource } from "@/components/admin/ui";

interface ImpactBox { title: string; text: string; }

/** Shape returned by POST /api/admin/verify */
interface VerifyResult {
  status: "verified" | "partially_verified" | "unverified";
  confidence: "high" | "medium" | "low";
  notes: string;
  sources: { num: number; title: string; url: string; publisher: string; year: string }[];
  annotated_content: string;
}

interface PendingVerify {
  section: string;            // form field key
  sectionLabel: string;
  result: VerifyResult;
  prevContent: string;        // original text before annotation
}

interface Issue {
  id: string; rank: number; slug: string; icon: string; severity: string;
  title: string; anchor_stat: string; short_desc: string; definition: string;
  australian_data: string; mechanisms: string; impacts: ImpactBox[];
  groups: string[]; sources: string[];
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

function ImpactCard({ impact, idx, onChange, onRemove }: {
  impact: ImpactBox; idx: number;
  onChange: (idx: number, field: keyof ImpactBox, val: string) => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--admin-bg-elevated)", border: "1px solid var(--admin-border)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--admin-text-faint)" }}>Impact #{idx + 1}</span>
        <button onClick={() => onRemove(idx)} className="admin-btn admin-btn-danger text-xs px-2.5 py-1">Remove</button>
      </div>
      <Field label="Title">
        <input className={I} style={IS} value={impact.title} onChange={e => onChange(idx, "title", e.target.value)} placeholder="e.g. Academic Performance" />
      </Field>
      <Field label="Description">
        <textarea rows={2} className={I} style={{ ...IS, resize: "vertical" }} value={impact.text} onChange={e => onChange(idx, "text", e.target.value)} placeholder="How this issue impacts students…" />
      </Field>
    </div>
  );
}

function TagList({ items, onAdd, onRemove, placeholder }: {
  items: string[]; onAdd: (val: string) => void; onRemove: (idx: number) => void; placeholder: string;
}) {
  const [input, setInput] = useState("");
  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault(); onAdd(input.trim()); setInput("");
    }
    if (e.key === "Backspace" && !input && items.length > 0) onRemove(items.length - 1);
  }
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((item, idx) => (
          <span key={idx} className="inline-flex items-center gap-1 text-[13px] px-3 py-1.5 rounded-lg font-medium"
            style={{ background: "#fff", color: "var(--admin-text-secondary)", border: "1px solid var(--admin-border)" }}>
            {item}
            <button onClick={() => onRemove(idx)} className="ml-1" style={{ color: "var(--admin-text-subtle)" }}>×</button>
          </span>
        ))}
      </div>
      <input className={I} style={IS} value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown} placeholder={items.length === 0 ? placeholder : "Type and press Enter…"} />
    </div>
  );
}

interface ImpactsTabProps {
  impacts: ImpactBox[];
  groups: string[];
  onAddImpact: () => void;
  onUpdateImpact: (idx: number, field: keyof ImpactBox, val: string) => void;
  onRemoveImpact: (idx: number) => void;
  onAddGroup: (val: string) => void;
  onRemoveGroup: (idx: number) => void;
}

function ImpactsTab({ impacts, groups, onAddImpact, onUpdateImpact, onRemoveImpact, onAddGroup, onRemoveGroup }: ImpactsTabProps) {
  return (
    <div className="space-y-6">
      <div className="admin-card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--admin-text-primary)" }}>Impact Areas</h2>
            <p className="text-xs mt-1" style={{ color: "var(--admin-text-subtle)" }}>How this issue affects students</p>
          </div>
          <button onClick={onAddImpact} className="admin-btn admin-btn-primary text-xs">+ Add Impact</button>
        </div>
        {impacts.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ border: "2px dashed var(--admin-border)" }}>
            <p className="text-xs" style={{ color: "var(--admin-text-faint)" }}>No impacts yet — click &quot;Add Impact&quot; to add one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {impacts.map((impact, idx) => <ImpactCard key={idx} impact={impact} idx={idx} onChange={onUpdateImpact} onRemove={onRemoveImpact} />)}
          </div>
        )}
      </div>

      <div className="admin-card">
        <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--admin-text-primary)" }}>Groups at Risk</h2>
        <p className="text-xs mb-4" style={{ color: "var(--admin-text-subtle)" }}>Type a group name and press Enter to add</p>
        <TagList items={groups} onAdd={onAddGroup} onRemove={onRemoveGroup}
          placeholder="e.g. Indigenous students, Rural students…" />
      </div>
    </div>
  );
}

interface NewSourceState { title: string; url: string; publisher: string; year: string; }

interface SourcesTabProps {
  isNew: boolean;
  dbSources: IssueSource[];
  sources: string[];
  addingSource: boolean;
  newSource: NewSourceState;
  onSetAddingSource: (v: boolean) => void;
  onSetNewSource: (fn: (s: NewSourceState) => NewSourceState) => void;
  onAddSource: () => void;
  onDeleteSource: (id: string) => void;
  inputClass: string;
  inputStyle: React.CSSProperties;
}

function SourcesTab({ isNew, dbSources, sources, addingSource, newSource, onSetAddingSource, onSetNewSource, onAddSource, onDeleteSource, inputClass, inputStyle }: SourcesTabProps) {
  return (
    <div className="space-y-4">
      <div className="admin-card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--admin-text-primary)" }}>References &amp; Citations</h2>
            <p className="text-xs mt-1" style={{ color: "var(--admin-text-subtle)" }}>
              Authoritative sources backing the data on this page. Use <strong>Verify</strong> in the Content tab to auto-discover sources.
            </p>
          </div>
          {!isNew && (
            <button onClick={() => onSetAddingSource(true)} className="admin-btn admin-btn-primary text-xs">+ Add Source</button>
          )}
        </div>

        {addingSource && (
          <div className="rounded-xl p-4 mb-4" style={{ background: "var(--admin-bg-elevated)", border: "1px solid var(--admin-border)" }}>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="Title *">
                <input className={inputClass} style={inputStyle} value={newSource.title} onChange={e => onSetNewSource(s => ({ ...s, title: e.target.value }))} placeholder="e.g. AIHW Mental Health Report 2024" />
              </Field>
              <Field label="URL">
                <input className={inputClass} style={inputStyle} value={newSource.url} onChange={e => onSetNewSource(s => ({ ...s, url: e.target.value }))} placeholder="https://..." />
              </Field>
              <Field label="Publisher">
                <input className={inputClass} style={inputStyle} value={newSource.publisher} onChange={e => onSetNewSource(s => ({ ...s, publisher: e.target.value }))} placeholder="e.g. Australian Institute of Health and Welfare" />
              </Field>
              <Field label="Year">
                <input className={inputClass} style={inputStyle} value={newSource.year} onChange={e => onSetNewSource(s => ({ ...s, year: e.target.value }))} placeholder="e.g. 2024" />
              </Field>
            </div>
            <div className="flex gap-2">
              <button onClick={onAddSource} className="admin-btn admin-btn-primary admin-btn-sm">Add</button>
              <button onClick={() => { onSetAddingSource(false); onSetNewSource(() => ({ title: "", url: "", publisher: "", year: "" })); }} className="admin-btn admin-btn-secondary admin-btn-sm">Cancel</button>
            </div>
          </div>
        )}

        {dbSources.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ border: "2px dashed var(--admin-border)" }}>
            <p className="text-xs" style={{ color: "var(--admin-text-faint)" }}>
              No sources yet. Use the <strong>Verify</strong> button in the Content tab to auto-discover sources, or add them manually.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {dbSources.sort((a, b) => a.num - b.num).map(src => (
              <div key={src.id} className="flex items-start gap-3 rounded-xl p-3" style={{ background: "var(--admin-bg-elevated)", border: "1px solid var(--admin-border)" }}>
                <span className="text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ width: 28, height: 28, background: src.verified ? "#DCFCE7" : "var(--admin-border)", color: src.verified ? "#166534" : "var(--admin-text-subtle)" }}>
                  {src.num}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: "var(--admin-text-primary)" }}>
                    {src.title}
                    {src.verified && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: "#DCFCE7", color: "#166534" }}>VERIFIED</span>}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--admin-text-subtle)" }}>
                    {src.publisher}{src.publisher && src.year && " · "}{src.year}
                  </div>
                  {src.url && (
                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-xs mt-0.5 block truncate" style={{ color: "var(--admin-accent)" }}>
                      {src.url}
                    </a>
                  )}
                </div>
                <button onClick={() => onDeleteSource(src.id)} className="admin-icon-btn flex-shrink-0" aria-label={`Delete source ${src.num}`}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {sources.length > 0 && (
        <div className="admin-card">
          <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--admin-text-primary)" }}>Legacy Sources (from old format)</h2>
          <p className="text-xs mb-3" style={{ color: "var(--admin-text-subtle)" }}>These are stored in the old JSONB format. Consider migrating them to the new structured sources above.</p>
          <div className="space-y-1">
            {sources.map((s, i) => (
              <div key={i} className="text-xs py-1.5 px-2 rounded" style={{ background: "var(--admin-bg-elevated)", color: "var(--admin-text-secondary)" }}>
                📄 {s}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function IssueEditForm({ issue, initialSources = [] }: { issue: Issue | null; initialSources?: IssueSource[] }) {
  const router = useRouter();
  const isNew = !issue;
  const [tab, setTab] = useState<"basic" | "content" | "impacts" | "sources" | "seo">("basic");
  const [dirty, setDirty] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [form, setForm] = useState({
    rank: issue?.rank ?? 0, slug: issue?.slug ?? "", icon: issue?.icon ?? "",
    severity: issue?.severity ?? "notable", title: issue?.title ?? "",
    anchor_stat: issue?.anchor_stat ?? "", short_desc: issue?.short_desc ?? "",
    definition: issue?.definition ?? "", australian_data: issue?.australian_data ?? "",
    mechanisms: issue?.mechanisms ?? "",
    seo_title: issue?.seo_title ?? "", seo_desc: issue?.seo_desc ?? "", og_image: issue?.og_image ?? "",
  });
  const [impacts, setImpacts] = useState<ImpactBox[]>(parseJsonArray<ImpactBox>(issue?.impacts, []));
  const [groups, setGroups] = useState<string[]>(parseJsonArray<string>(issue?.groups, []));
  const [sources, setSources] = useState<string[]>(parseJsonArray<string>(issue?.sources, []));

  // ── DB-backed sources ──
  const [dbSources, setDbSources] = useState<IssueSource[]>(initialSources);
  const [addingSource, setAddingSource] = useState(false);
  const [newSource, setNewSource] = useState({ title: "", url: "", publisher: "", year: "" });

  // ── Verification state ──
  const [verifying, setVerifying] = useState<string | null>(null); // field key being verified
  const [pendingVerify, setPendingVerify] = useState<PendingVerify | null>(null);
  const [verifyError, setVerifyError] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function set(key: string, value: string | number) {
    setForm(f => ({ ...f, [key]: value }));
    setDirty(true); setSuccess(false);
  }

  function updateImpact(idx: number, field: keyof ImpactBox, val: string) {
    setImpacts(s => s.map((item, i) => i === idx ? { ...item, [field]: val } : item));
    setDirty(true);
  }
  function removeImpact(idx: number) { setImpacts(s => s.filter((_, i) => i !== idx)); setDirty(true); }
  function addImpact() { setImpacts(s => [...s, { title: "", text: "" }]); setDirty(true); }

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.slug.trim()) { setError("Slug is required."); return; }
    setSaving(true); setError(""); setSuccess(false);
    const sb = createClient();
    const payload = {
      rank: Number(form.rank), slug: form.slug.trim(), icon: form.icon.trim(),
      severity: form.severity, title: form.title.trim(), anchor_stat: form.anchor_stat.trim(),
      short_desc: form.short_desc.trim(), definition: form.definition.trim(),
      australian_data: form.australian_data.trim(), mechanisms: form.mechanisms.trim(),
      impacts, groups, sources,
      seo_title: form.seo_title.trim(), seo_desc: form.seo_desc.trim(), og_image: form.og_image.trim(),
    };
    if (isNew) {
      const { data, error: err } = await sb.from("issues").insert(payload).select("id").single();
      if (err) { setError(err.message); } else if (data) { router.push(`/admin/issues/${data.id}`); router.refresh(); return; }
    } else {
      const { error: err } = await sb.from("issues").update(payload).eq("id", issue!.id);
      if (err) { setError(err.message); } else { setSuccess(true); setDirty(false); router.refresh(); }
    }
    setSaving(false);
  }, [form, impacts, groups, sources, isNew, issue, router]);

  async function handleDelete() {
    if (!issue) return;
    const sb = createClient();
    const { error: delErr } = await sb.from("issues").delete().eq("id", issue.id);
    if (delErr) { setError(delErr.message); setShowDeleteModal(false); return; }
    router.push("/admin/issues"); router.refresh();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); handleSave(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave]);

  // ── Verify a content section ──
  async function handleVerify(fieldKey: string, label: string) {
    const content = form[fieldKey as keyof typeof form];
    if (!content || typeof content !== "string" || !content.trim()) {
      setVerifyError(`"${label}" is empty — nothing to verify.`);
      return;
    }
    if (!issue?.id) { setVerifyError("Save the issue first."); return; }

    setVerifying(fieldKey); setVerifyError(""); setPendingVerify(null);

    try {
      const sb = createClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) { setVerifyError("Not authenticated."); return; }

      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
        body: JSON.stringify({
          content,
          section_label: label,
          issue_title: form.title,
          existing_source_count: dbSources.length,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) { setVerifyError(json.error ?? "Verification failed."); return; }

      setPendingVerify({
        section: fieldKey,
        sectionLabel: label,
        result: json as VerifyResult,
        prevContent: content as string,
      });
    } catch {
      setVerifyError("Network error during verification.");
    } finally {
      setVerifying(null);
    }
  }

  async function acceptVerification() {
    if (!pendingVerify) return;
    const { section, result } = pendingVerify;
    // Apply annotated content
    if (result.annotated_content) {
      setForm(f => ({ ...f, [section]: result.annotated_content }));
      setDirty(true);
    }
    // Add suggested sources to DB
    if (result.sources?.length && issue?.id) {
      const sb = createClient();
      const inserted = await Promise.all(
        result.sources.map(s =>
          sb.from("issue_sources").insert({
            issue_id: issue!.id,
            num: s.num,
            title: s.title,
            url: s.url,
            publisher: s.publisher ?? "",
            year: s.year ?? "",
            verified: true,
          }).select().single()
        )
      );
      const newRows = inserted.flatMap(r => r.data ? [r.data] : []);
      if (newRows.length) setDbSources(prev => [...prev, ...newRows]);
    }
    setPendingVerify(null);
    setVerifyError("");
  }

  function rejectVerification() {
    if (!pendingVerify) return;
    setForm(f => ({ ...f, [pendingVerify.section]: pendingVerify.prevContent }));
    setPendingVerify(null);
    setVerifyError("");
  }

  // ── Source CRUD (DB-backed) ──
  async function handleAddSource() {
    if (!issue?.id || !newSource.title.trim()) return;
    const nextNum = dbSources.length > 0 ? Math.max(...dbSources.map(s => s.num)) + 1 : 1;
    const sb = createClient();
    const { data, error: err } = await sb.from("issue_sources").insert({
      issue_id: issue.id,
      num: nextNum,
      title: newSource.title.trim(),
      url: newSource.url.trim(),
      publisher: newSource.publisher.trim(),
      year: newSource.year.trim(),
      verified: false,
    }).select().single();
    if (err) { setError(err.message); return; }
    if (data) setDbSources(prev => [...prev, data]);
    setNewSource({ title: "", url: "", publisher: "", year: "" });
    setAddingSource(false);
  }

  async function handleDeleteSource(sourceId: string) {
    const sb = createClient();
    const { error: err } = await sb.from("issue_sources").delete().eq("id", sourceId);
    if (err) { setError(err.message); return; }
    setDbSources(prev => prev.filter(s => s.id !== sourceId));
  }

  const TABS = [
    { id: "basic",   label: "Basic Info",     count: null },
    { id: "content", label: "Content",        count: null },
    { id: "impacts", label: "Impacts & Data", count: impacts.length },
    { id: "sources", label: "Sources",        count: dbSources.length },
    { id: "seo",     label: "SEO",            count: null },
  ] as const;

  return (
    <div className="max-w-4xl">
      <ConfirmModal open={showDeleteModal} title="Delete this issue?"
        message={`"${issue?.title}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete Issue" onConfirm={handleDelete} onCancel={() => setShowDeleteModal(false)} />

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

      {/* ── Tab: Basic Info ── */}
      {tab === "basic" && (
        <div className="admin-card">
          <div className="grid grid-cols-3 gap-5 mb-1">
            <Field label="Rank"><input type="number" className={I} style={IS} value={form.rank} onChange={e => set("rank", e.target.value)} /></Field>
            <Field label="Icon (emoji)"><input className={I} style={IS} value={form.icon} onChange={e => set("icon", e.target.value)} placeholder="😰" /></Field>
            <Field label="Severity">
              <select className={I} style={IS} value={form.severity} onChange={e => set("severity", e.target.value)}>
                <option value="critical">Critical</option><option value="high">High</option><option value="notable">Notable</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-5 mb-1">
            <Field label="Slug"><input className={I} style={IS} value={form.slug} onChange={e => set("slug", e.target.value)} placeholder="e.g. anxiety" /></Field>
            <Field label="Anchor Stat"><input className={I} style={IS} value={form.anchor_stat} onChange={e => set("anchor_stat", e.target.value)} placeholder="e.g. 1 in 7 students" /></Field>
          </div>
          <Field label="Title">
            <input className={I} style={{ ...IS, fontSize: "1rem", fontWeight: 600 }} value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Anxiety Disorders" />
          </Field>
          <Field label="Short Description">
            <textarea rows={3} className={I} style={{ ...IS, resize: "vertical" }} value={form.short_desc} onChange={e => set("short_desc", e.target.value)} placeholder="Brief summary for listings and previews" />
          </Field>
        </div>
      )}

      {/* ── Tab: Content ── */}
      {tab === "content" && (
        <div className="admin-card">
          {/* Verify feedback */}
          {verifyError && <div className="admin-alert admin-alert-error mb-4">{verifyError}</div>}

          {/* Accept/Reject banner */}
          {pendingVerify && (
            <div className="mb-6" style={{ padding: "14px 18px", borderRadius: 12, background: pendingVerify.result.status === "verified" ? "#F0FDF4" : pendingVerify.result.status === "partially_verified" ? "#FFFBEB" : "#FEF2F2", border: `1px solid ${pendingVerify.result.status === "verified" ? "#BBF7D0" : pendingVerify.result.status === "partially_verified" ? "#FDE68A" : "#FECACA"}` }}>
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: 18 }}>{pendingVerify.result.status === "verified" ? "✓" : pendingVerify.result.status === "partially_verified" ? "⚠" : "✗"}</span>
                <strong className="text-sm" style={{ textTransform: "capitalize" }}>{pendingVerify.result.status.replace("_", " ")}</strong>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(0,0,0,0.06)" }}>
                  {pendingVerify.result.confidence} confidence
                </span>
                <span className="text-xs" style={{ color: "var(--admin-text-subtle)" }}>— {pendingVerify.sectionLabel}</span>
              </div>
              <p className="text-sm mb-3" style={{ color: "var(--admin-text-secondary)", lineHeight: 1.6 }}>{pendingVerify.result.notes}</p>
              {pendingVerify.result.sources?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--admin-text-subtle)" }}>Suggested Sources ({pendingVerify.result.sources.length})</p>
                  <div className="space-y-1">
                    {pendingVerify.result.sources.map((s, i) => (
                      <div key={i} className="text-xs" style={{ color: "var(--admin-text-secondary)" }}>
                        <strong>({s.num})</strong> {s.title} {s.publisher && `— ${s.publisher}`} {s.year && `(${s.year})`}
                        {s.url && <> — <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--admin-accent)" }}>{s.url.slice(0, 60)}…</a></>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={acceptVerification} className="admin-btn admin-btn-primary admin-btn-sm" style={{ gap: 5 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Accept &amp; Add Sources
                </button>
                <button onClick={rejectVerification} className="admin-btn admin-btn-danger admin-btn-sm" style={{ gap: 5 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  Reject
                </button>
              </div>
            </div>
          )}

          {[
            { key: "definition", label: "Definition (What Is It?)", placeholder: "Detailed definition of this wellbeing issue…" },
            { key: "australian_data", label: "Australian Data", placeholder: "Key Australian statistics and findings…" },
            { key: "mechanisms", label: "Mechanisms (How It Affects Learning)", placeholder: "Describe the pathways through which this issue impacts student learning…" },
          ].map(sec => (
            <div key={sec.key} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className={L} style={{ ...LS, margin: 0 }}>{sec.label}</label>
                {!isNew && (
                  <button
                    type="button"
                    onClick={() => handleVerify(sec.key, sec.label)}
                    disabled={verifying === sec.key}
                    className="admin-btn admin-btn-secondary admin-btn-sm"
                    style={{ opacity: verifying === sec.key ? 0.6 : 1, gap: 5 }}
                  >
                    {verifying === sec.key ? (
                      <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                    ) : (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                    )}
                    {verifying === sec.key ? "Verifying…" : "Verify"}
                  </button>
                )}
              </div>
              <textarea
                rows={5}
                className={I}
                style={{ ...IS, resize: "vertical", ...(pendingVerify?.section === sec.key ? { borderColor: "var(--admin-accent)", boxShadow: "0 0 0 2px rgba(89,37,244,0.15)" } : {}) }}
                value={form[sec.key as keyof typeof form] as string}
                onChange={e => set(sec.key, e.target.value)}
                placeholder={sec.placeholder}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Impacts & Data ── */}
      {tab === "impacts" && (
        <ImpactsTab
          impacts={impacts}
          groups={groups}
          onAddImpact={addImpact}
          onUpdateImpact={updateImpact}
          onRemoveImpact={removeImpact}
          onAddGroup={val => { setGroups(g => [...g, val]); setDirty(true); }}
          onRemoveGroup={idx => { setGroups(g => g.filter((_, i) => i !== idx)); setDirty(true); }}
        />
      )}

      {/* ── Tab: Sources ── */}
      {tab === "sources" && (
        <SourcesTab
          isNew={isNew}
          dbSources={dbSources}
          sources={sources}
          addingSource={addingSource}
          newSource={newSource}
          onSetAddingSource={setAddingSource}
          onSetNewSource={setNewSource}
          onAddSource={handleAddSource}
          onDeleteSource={handleDeleteSource}
          inputClass={I}
          inputStyle={IS}
        />
      )}

      {/* ── Tab: SEO ── */}
      {tab === "seo" && (
        <SeoPanel seoTitle={form.seo_title} seoDesc={form.seo_desc} ogImage={form.og_image}
          defaultTitle={form.title} defaultDesc={form.short_desc} onChange={(field, value) => set(field, value)} />
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
            {saving ? "Saving…" : isNew ? "Create Issue" : "Save Changes"}
          </button>
          {dirty && !saving && (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--admin-warning-light)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--admin-warning-light)" }} />
              Unsaved changes
            </span>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => router.push("/admin/issues")} className="admin-btn admin-btn-ghost">← Back</button>
            {!isNew && <button onClick={() => setShowDeleteModal(true)} className="admin-btn admin-btn-danger">Delete</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
