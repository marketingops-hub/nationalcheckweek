"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

interface VaultSource {
  id: string;
  url: string;
  title: string;
  description: string;
  domain: string;
  category: string;
  is_approved: boolean;
  created_at: string;
}

const CATEGORIES = ["general", "mental health", "education", "government", "research", "statistics", "other"];

const INPUT = "w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500";
const INPUT_STYLE = { background: "#0D1117", border: "1px solid #30363D", color: "#C9D1D9" };
const LABEL = "block text-xs font-semibold mb-1.5 uppercase tracking-wide";
const LABEL_STYLE = { color: "#6E7681" };

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function getDomainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function VaultSourcesClient({ initialSources }: { initialSources: VaultSource[] }) {
  const [sources, setSources] = useState<VaultSource[]>(initialSources);
  const [showAdd, setShowAdd] = useState(false);
  const [editSource, setEditSource] = useState<VaultSource | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("general");
  const [pasteText, setPasteText] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterApproved, setFilterApproved] = useState("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function clearMessages() { setError(""); setSuccess(""); }

  const filtered = useMemo(() => {
    return sources.filter(s => {
      const matchSearch = !search || s.url.includes(search) || s.title.toLowerCase().includes(search.toLowerCase()) || s.domain.includes(search);
      const matchCat = filterCategory === "all" || s.category === filterCategory;
      const matchApproved = filterApproved === "all" || (filterApproved === "approved" ? s.is_approved : !s.is_approved);
      return matchSearch && matchCat && matchApproved;
    });
  }, [sources, search, filterCategory, filterApproved]);

  const approvedCount = sources.filter(s => s.is_approved).length;

  async function handleAdd() {
    const url = pasteText.trim();
    if (!url) { setError("Paste a URL first."); return; }
    // Basic URL validation
    try { new URL(url); } catch { setError("That doesn't look like a valid URL. Make sure it starts with http:// or https://"); return; }

    setBusy(true); clearMessages();
    const sb = createClient();
    const { data, error: err } = await sb
      .from("vault_sources")
      .insert({
        url,
        title: title.trim() || getDomainFromUrl(url),
        description: description.trim(),
        category,
        is_approved: true,
      })
      .select()
      .single();

    if (err) {
      if (err.code === "23505") setError("This URL is already in the vault.");
      else setError(err.message);
      setBusy(false);
      return;
    }

    setSources(s => [data, ...s]);
    setPasteText(""); setTitle(""); setDescription(""); setCategory("general");
    setShowAdd(false);
    setSuccess(`✓ Source added: ${data.domain}`);
    setBusy(false);
  }

  async function handleEdit() {
    if (!editSource) return;
    setBusy(true); clearMessages();
    const sb = createClient();
    const { error: err } = await sb
      .from("vault_sources")
      .update({ title: editTitle.trim(), description: editDescription.trim(), category: editCategory })
      .eq("id", editSource.id);
    if (err) { setError(err.message); setBusy(false); return; }
    setSources(s => s.map(s2 => s2.id === editSource.id
      ? { ...s2, title: editTitle.trim(), description: editDescription.trim(), category: editCategory }
      : s2
    ));
    setEditSource(null);
    setSuccess("✓ Source updated.");
    setBusy(false);
  }

  async function handleToggleApproved(source: VaultSource) {
    const sb = createClient();
    const { error: err } = await sb
      .from("vault_sources")
      .update({ is_approved: !source.is_approved })
      .eq("id", source.id);
    if (err) { setError(err.message); return; }
    setSources(s => s.map(s2 => s2.id === source.id ? { ...s2, is_approved: !s2.is_approved } : s2));
  }

  async function handleDelete(source: VaultSource) {
    if (!confirm(`Remove "${source.url}" from the vault? This cannot be undone.`)) return;
    setBusy(true); clearMessages();
    const sb = createClient();
    const { error: err } = await sb.from("vault_sources").delete().eq("id", source.id);
    if (err) { setError(err.message); setBusy(false); return; }
    setSources(s => s.filter(s2 => s2.id !== source.id));
    setSuccess("Source removed from vault.");
    setBusy(false);
  }

  return (
    <div className="mt-6">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Sources", value: sources.length, color: "#58A6FF", bg: "#1C2A3A" },
          { label: "Approved", value: approvedCount, color: "#6EE7B7", bg: "#0D2D1A" },
          { label: "Suspended", value: sources.length - approvedCount, color: "#F0883E", bg: "#2D1A0E" },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl px-5 py-4" style={{ background: stat.bg, border: `1px solid ${stat.color}22` }}>
            <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "#6E7681" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          className="rounded-lg px-3 py-2 text-sm outline-none flex-1 min-w-[180px]"
          style={INPUT_STYLE}
          placeholder="Search URLs, titles, domains…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="rounded-lg px-3 py-2 text-sm outline-none" style={INPUT_STYLE} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="rounded-lg px-3 py-2 text-sm outline-none" style={INPUT_STYLE} value={filterApproved} onChange={e => setFilterApproved(e.target.value)}>
          <option value="all">All status</option>
          <option value="approved">Approved only</option>
          <option value="suspended">Suspended only</option>
        </select>
        <button
          onClick={() => { setShowAdd(true); clearMessages(); setPasteText(""); setTitle(""); setDescription(""); setCategory("general"); }}
          className="text-sm font-semibold px-4 py-2 rounded-lg flex-shrink-0"
          style={{ background: "#F0883E", color: "#FFFFFF" }}
        >
          + Add Source
        </button>
      </div>

      {/* Feedback */}
      {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "#3D1515", color: "#F87171", border: "1px solid #7F1D1D" }}>{error}</div>}
      {success && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "#0D2D1A", color: "#6EE7B7", border: "1px solid #166534" }}>{success}</div>}

      {/* Edit Source Modal */}
      {editSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-lg rounded-xl p-6" style={{ background: "#161B22", border: "1px solid #30363D" }}>
            <h2 className="text-base font-semibold mb-1" style={{ color: "#E6EDF3" }}>Edit Source</h2>
            <p className="text-xs mb-1 font-mono truncate" style={{ color: "#484F58" }}>{editSource.url}</p>
            <p className="text-xs mb-5" style={{ color: "#6E7681" }}>URL cannot be changed. Delete and re-add to change the URL.</p>
            <div className="mb-4">
              <label className={LABEL} style={LABEL_STYLE}>Title</label>
              <input className={INPUT} style={INPUT_STYLE} value={editTitle}
                onChange={e => setEditTitle(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className={LABEL} style={LABEL_STYLE}>Description</label>
              <textarea rows={3} className={INPUT} style={{ ...INPUT_STYLE, resize: "none" }}
                value={editDescription} onChange={e => setEditDescription(e.target.value)} />
            </div>
            <div className="mb-6">
              <label className={LABEL} style={LABEL_STYLE}>Category</label>
              <select className={INPUT} style={INPUT_STYLE} value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {error && <div className="mb-4 px-3 py-2 rounded text-xs" style={{ background: "#3D1515", color: "#F87171" }}>{error}</div>}
            <div className="flex gap-3">
              <button onClick={handleEdit} disabled={busy}
                className="flex-1 text-sm font-semibold py-2.5 rounded-lg"
                style={{ background: "#F0883E", color: "#FFFFFF", opacity: busy ? 0.6 : 1 }}>
                {busy ? "Saving…" : "Save Changes"}
              </button>
              <button onClick={() => { setEditSource(null); clearMessages(); }}
                className="flex-1 text-sm font-semibold py-2.5 rounded-lg"
                style={{ background: "#21262D", color: "#C9D1D9" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Source Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-lg rounded-xl p-6" style={{ background: "#161B22", border: "1px solid #30363D" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#F0883E" }}>The Vault</span>
            </div>
            <h2 className="text-base font-semibold mb-1" style={{ color: "#E6EDF3" }}>Add Approved Source</h2>
            <p className="text-xs mb-5" style={{ color: "#6E7681" }}>
              Paste a URL below. OpenAI will only use approved vault sources when generating content.
            </p>

            <div className="mb-4">
              <label className={LABEL} style={LABEL_STYLE}>URL — paste here</label>
              <textarea
                rows={3}
                className={INPUT}
                style={{ ...INPUT_STYLE, resize: "none", fontFamily: "monospace", fontSize: "0.8rem" }}
                value={pasteText}
                onChange={e => setPasteText(e.target.value.trim())}
                placeholder="https://www.aihw.gov.au/reports/mental-health/..."
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label className={LABEL} style={LABEL_STYLE}>Title <span style={{ color: "#484F58", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional — auto-filled from domain if blank)</span></label>
              <input className={INPUT} style={INPUT_STYLE} value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. AIHW Mental Health Report 2023" />
            </div>
            <div className="mb-4">
              <label className={LABEL} style={LABEL_STYLE}>Description <span style={{ color: "#484F58", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
              <textarea rows={2} className={INPUT} style={{ ...INPUT_STYLE, resize: "none" }}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief note about what this source covers…" />
            </div>
            <div className="mb-6">
              <label className={LABEL} style={LABEL_STYLE}>Category</label>
              <select className={INPUT} style={INPUT_STYLE} value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {error && <div className="mb-4 px-3 py-2 rounded text-xs" style={{ background: "#3D1515", color: "#F87171" }}>{error}</div>}

            <div className="flex gap-3">
              <button onClick={handleAdd} disabled={busy}
                className="flex-1 text-sm font-semibold py-2.5 rounded-lg"
                style={{ background: busy ? "#21262D" : "#F0883E", color: "#FFFFFF", opacity: busy ? 0.6 : 1 }}>
                {busy ? "Adding…" : "Add to Vault"}
              </button>
              <button onClick={() => { setShowAdd(false); clearMessages(); }}
                className="flex-1 text-sm font-semibold py-2.5 rounded-lg"
                style={{ background: "#21262D", color: "#C9D1D9" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sources list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl p-10 text-center" style={{ background: "#161B22", border: "1px solid #21262D" }}>
          <div className="text-3xl mb-3">🔒</div>
          <p className="text-sm font-medium mb-1" style={{ color: "#C9D1D9" }}>
            {sources.length === 0 ? "No sources in the vault yet" : "No sources match your filters"}
          </p>
          <p className="text-xs" style={{ color: "#484F58" }}>
            {sources.length === 0
              ? "Add your first approved source above. AI content generation will only use URLs from this vault."
              : "Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(source => (
            <div
              key={source.id}
              className="rounded-xl p-4"
              style={{
                background: "#0D1117",
                border: `1px solid ${source.is_approved ? "#21262D" : "#3D1515"}`,
              }}
            >
              <div className="flex items-start gap-3">
                {/* Domain favicon placeholder */}
                <div
                  className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{ background: "#161B22", border: "1px solid #21262D", color: "#6E7681" }}
                >
                  {source.domain.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm truncate" style={{ color: "#E6EDF3" }}>
                      {source.title || source.domain}
                    </span>
                    {/* Approved badge */}
                    <button
                      onClick={() => handleToggleApproved(source)}
                      className="text-xs font-bold px-2 py-0.5 rounded flex-shrink-0"
                      style={{
                        background: source.is_approved ? "#0D2D1A" : "#3D1515",
                        color: source.is_approved ? "#6EE7B7" : "#F87171",
                        border: `1px solid ${source.is_approved ? "#166534" : "#7F1D1D"}`,
                      }}
                    >
                      {source.is_approved ? "✓ Approved" : "✗ Suspended"}
                    </button>
                    {/* Category */}
                    <span className="text-xs px-2 py-0.5 rounded capitalize" style={{ background: "#21262D", color: "#8B949E" }}>
                      {source.category}
                    </span>
                  </div>

                  {/* URL */}
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs block truncate mb-1"
                    style={{ color: "#58A6FF" }}
                  >
                    {source.url}
                  </a>

                  {/* Description */}
                  {source.description && (
                    <p className="text-xs" style={{ color: "#6E7681" }}>{source.description}</p>
                  )}

                  <div className="text-xs mt-1.5" style={{ color: "#484F58" }}>Added {fmt(source.created_at)}</div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => { setEditSource(source); setEditTitle(source.title); setEditDescription(source.description); setEditCategory(source.category); clearMessages(); }}
                    className="text-xs font-semibold px-3 py-1.5 rounded"
                    style={{ background: "#21262D", color: "#C9D1D9" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(source)}
                    disabled={busy}
                    className="text-xs font-semibold px-3 py-1.5 rounded"
                    style={{ background: "#3D1515", color: "#F87171", border: "1px solid #7F1D1D" }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info callout */}
      <div className="mt-6 rounded-xl p-4" style={{ background: "#161B22", border: "1px solid #21262D" }}>
        <div className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: "#F0883E" }}>How the Vault works</div>
        <p className="text-xs leading-relaxed" style={{ color: "#6E7681" }}>
          When AI content generation is triggered, the system passes only the <strong style={{ color: "#8B949E" }}>approved</strong> vault sources to OpenAI as its permitted knowledge base. OpenAI is instructed to base all factual claims exclusively on these URLs and cite them in its output — preventing hallucinated statistics or uncited claims. Suspending a source removes it from AI prompts without deleting it.
        </p>
      </div>
    </div>
  );
}
