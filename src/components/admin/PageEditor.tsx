"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SeoPanel from "@/components/admin/SeoPanel";

// ─── Block types ────────────────────────────────────────────────
type BlockType = "heading" | "paragraph" | "image" | "cta" | "divider" | "two-col" | "callout" | "html";

interface Block {
  id: string;
  type: BlockType;
  data: Record<string, string>;
}

interface Page {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: Block[];
  status: string;
  show_in_menu: boolean;
  meta_title: string;
  meta_desc: string;
  og_image: string;
}

// ─── Helpers ────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 10); }

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: string; defaults: Record<string, string> }[] = [
  { type: "heading",   label: "Heading",     icon: "H",  defaults: { text: "New Heading", level: "h2" } },
  { type: "paragraph", label: "Paragraph",   icon: "¶",  defaults: { text: "Write your content here…" } },
  { type: "image",     label: "Image",       icon: "🖼", defaults: { src: "", alt: "", caption: "" } },
  { type: "cta",       label: "CTA Button",  icon: "→",  defaults: { label: "Learn More", href: "/", style: "primary" } },
  { type: "callout",   label: "Callout",     icon: "💡", defaults: { text: "", style: "info" } },
  { type: "two-col",   label: "Two Columns", icon: "⬛⬛", defaults: { left: "", right: "" } },
  { type: "divider",   label: "Divider",     icon: "—",  defaults: {} },
  { type: "html",      label: "Raw HTML",    icon: "<>", defaults: { html: "" } },
];

// ─── Styles ─────────────────────────────────────────────────────
const INPUT = "w-full rounded-lg px-3 py-2 text-sm outline-none";
const IS: React.CSSProperties = { background: "#fff", border: "1px solid var(--admin-border-strong)", color: "var(--admin-text-primary)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" };
const LABEL = "block text-xs font-semibold mb-1.5 uppercase tracking-wide";
const LS: React.CSSProperties = { color: "var(--admin-text-subtle)" };
const FIELD = "mb-4";

// ─── Block editor ───────────────────────────────────────────────
function BlockEditor({ block, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }:
  { block: Block; onChange: (b: Block) => void; onDelete: () => void; onMoveUp: () => void; onMoveDown: () => void; isFirst: boolean; isLast: boolean }) {

  function set(key: string, val: string) {
    onChange({ ...block, data: { ...block.data, [key]: val } });
  }

  return (
    <div className="rounded-xl overflow-hidden mb-3" style={{ border: "1px solid var(--admin-border)", background: "#fff" }}>
      {/* Block header */}
      <div className="flex items-center gap-2 px-4 py-2" style={{ background: "var(--admin-bg-elevated)", borderBottom: "1px solid var(--admin-border)" }}>
        <span className="text-xs font-mono" style={{ color: "var(--admin-text-faint)" }}>
          {BLOCK_TYPES.find(b => b.type === block.type)?.icon}
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide flex-1" style={{ color: "var(--admin-text-subtle)" }}>
          {BLOCK_TYPES.find(b => b.type === block.type)?.label}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={onMoveUp} disabled={isFirst} className="text-xs px-2 py-1 rounded" style={{ background: "var(--admin-bg-deep)", color: isFirst ? "var(--admin-border-strong)" : "var(--admin-text-muted)" }}>↑</button>
          <button onClick={onMoveDown} disabled={isLast} className="text-xs px-2 py-1 rounded" style={{ background: "var(--admin-bg-deep)", color: isLast ? "var(--admin-border-strong)" : "var(--admin-text-muted)" }}>↓</button>
          <button onClick={onDelete} className="text-xs px-2 py-1 rounded" style={{ background: "var(--admin-danger-bg)", color: "var(--admin-danger-text)" }}>✕</button>
        </div>
      </div>

      {/* Block fields */}
      <div className="p-4">
        {block.type === "heading" && (
          <div className="flex gap-3">
            <div className="w-24 flex-shrink-0">
              <label className={LABEL} style={LS}>Level</label>
              <select className={INPUT} style={IS} value={block.data.level} onChange={e => set("level", e.target.value)}>
                {["h1","h2","h3","h4"].map(h => <option key={h} value={h}>{h.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className={LABEL} style={LS}>Text</label>
              <input className={INPUT} style={IS} value={block.data.text} onChange={e => set("text", e.target.value)} />
            </div>
          </div>
        )}

        {block.type === "paragraph" && (
          <>
            <label className={LABEL} style={LS}>Content</label>
            <textarea rows={5} className={INPUT} style={{ ...IS, resize: "vertical" }}
              value={block.data.text} onChange={e => set("text", e.target.value)} />
          </>
        )}

        {block.type === "image" && (
          <>
            <div className={FIELD}>
              <label className={LABEL} style={LS}>Image URL</label>
              <input className={INPUT} style={IS} value={block.data.src} onChange={e => set("src", e.target.value)} placeholder="https://..." />
            </div>
            <div className={FIELD}>
              <label className={LABEL} style={LS}>Alt Text</label>
              <input className={INPUT} style={IS} value={block.data.alt} onChange={e => set("alt", e.target.value)} />
            </div>
            <div>
              <label className={LABEL} style={LS}>Caption (optional)</label>
              <input className={INPUT} style={IS} value={block.data.caption} onChange={e => set("caption", e.target.value)} />
            </div>
          </>
        )}

        {block.type === "cta" && (
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className={LABEL} style={LS}>Button Label</label>
              <input className={INPUT} style={IS} value={block.data.label} onChange={e => set("label", e.target.value)} />
            </div>
            <div>
              <label className={LABEL} style={LS}>Style</label>
              <select className={INPUT} style={IS} value={block.data.style} onChange={e => set("style", e.target.value)}>
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="outline">Outline</option>
              </select>
            </div>
            <div className="col-span-3">
              <label className={LABEL} style={LS}>URL</label>
              <input className={INPUT} style={IS} value={block.data.href} onChange={e => set("href", e.target.value)} placeholder="/ or https://..." />
            </div>
          </div>
        )}

        {block.type === "callout" && (
          <>
            <div className={FIELD}>
              <label className={LABEL} style={LS}>Style</label>
              <select className={INPUT} style={IS} value={block.data.style} onChange={e => set("style", e.target.value)}>
                <option value="info">Info (blue)</option>
                <option value="warning">Warning (orange)</option>
                <option value="success">Success (green)</option>
                <option value="danger">Danger (red)</option>
              </select>
            </div>
            <div>
              <label className={LABEL} style={LS}>Content</label>
              <textarea rows={3} className={INPUT} style={{ ...IS, resize: "vertical" }}
                value={block.data.text} onChange={e => set("text", e.target.value)} />
            </div>
          </>
        )}

        {block.type === "two-col" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL} style={LS}>Left Column</label>
              <textarea rows={5} className={INPUT} style={{ ...IS, resize: "vertical" }}
                value={block.data.left} onChange={e => set("left", e.target.value)} />
            </div>
            <div>
              <label className={LABEL} style={LS}>Right Column</label>
              <textarea rows={5} className={INPUT} style={{ ...IS, resize: "vertical" }}
                value={block.data.right} onChange={e => set("right", e.target.value)} />
            </div>
          </div>
        )}

        {block.type === "divider" && (
          <p className="text-xs text-center py-1" style={{ color: "var(--admin-text-faint)" }}>— horizontal rule —</p>
        )}

        {block.type === "html" && (
          <>
            <label className={LABEL} style={LS}>Raw HTML</label>
            <textarea rows={6} className={`${INPUT} font-mono text-xs`} style={{ ...IS, resize: "vertical" }}
              value={block.data.html} onChange={e => set("html", e.target.value)}
              placeholder="<div>Custom HTML…</div>" />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main PageEditor ─────────────────────────────────────────────
export default function PageEditor({ page }: { page: Page | null }) {
  const router = useRouter();
  const isNew = !page;

  const [title, setTitle] = useState(page?.title ?? "");
  const [slug, setSlug] = useState(page?.slug ?? "");
  const [description, setDescription] = useState(page?.description ?? "");
  const [blocks, setBlocks] = useState<Block[]>((page?.content as Block[]) ?? []);
  const [status, setStatus] = useState(page?.status ?? "draft");
  const [showInMenu, setShowInMenu] = useState(page?.show_in_menu ?? false);
  const [metaTitle, setMetaTitle] = useState(page?.meta_title ?? "");
  const [metaDesc, setMetaDesc] = useState(page?.meta_desc ?? "");
  const [ogImage, setOgImage] = useState(page?.og_image ?? "");
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"content" | "settings">("content");
  const [isDirty, setIsDirty] = useState(false);

  function handleTitleChange(v: string) {
    setTitle(v);
    if (isNew) setSlug(slugify(v));
    setIsDirty(true);
  }

  function addBlock(type: BlockType) {
    const def = BLOCK_TYPES.find(b => b.type === type)!;
    setBlocks(b => [...b, { id: uid(), type, data: { ...def.defaults } }]);
    setShowBlockPicker(false);
    setIsDirty(true);
  }

  function updateBlock(id: string, updated: Block) {
    setBlocks(b => b.map(bl => bl.id === id ? updated : bl));
    setIsDirty(true);
  }

  function deleteBlock(id: string) {
    setBlocks(b => b.filter(bl => bl.id !== id));
    setIsDirty(true);
  }

  function moveBlock(idx: number, dir: -1 | 1) {
    const next = [...blocks];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setBlocks(next);
    setIsDirty(true);
  }

  async function handleSave(publishNow?: boolean) {
    if (!title.trim()) { setError("Title is required."); return; }
    if (!slug.trim())  { setError("Slug is required."); return; }
    setSaving(true); setError(""); setSuccess("");

    const payload = {
      slug: slug.trim(),
      title: title.trim(),
      description: description.trim(),
      content: blocks,
      status: publishNow ? "published" : status,
      show_in_menu: showInMenu,
      meta_title: metaTitle.trim(),
      meta_desc: metaDesc.trim(),
      og_image: ogImage.trim(),
    };

    const sb = createClient();
    let err;

    if (isNew) {
      const res = await sb.from("pages").insert(payload).select("id").single();
      err = res.error;
      if (!err && res.data) {
        router.push(`/admin/cms/pages/${res.data.id}`);
        router.refresh();
        return;
      }
    } else {
      const res = await sb.from("pages").update(payload).eq("id", page!.id);
      err = res.error;
    }

    if (err) {
      if (err.code === "23505") setError("A page with this slug already exists. Change the slug and try again.");
      else setError(err.message);
    } else {
      setSuccess(publishNow ? "✓ Published" : "✓ Saved");
      if (publishNow) setStatus("published");
      setIsDirty(false);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!page || !confirm(`Delete page "${page.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    const sb = createClient();
    await sb.from("pages").delete().eq("id", page.id);
    router.push("/admin/cms/pages");
    router.refresh();
  }

  return (
    <div className="flex gap-6 items-start">
      {/* Main editor */}
      <div className="flex-1 min-w-0">
        {/* Tabs */}
        <div className="flex gap-1 mb-6" style={{ borderBottom: "1px solid var(--admin-border)" }}>
          {(["content", "settings"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="text-sm font-semibold px-4 py-2.5 capitalize"
              style={{
                color: activeTab === tab ? "var(--admin-text-primary)" : "var(--admin-text-subtle)",
                borderBottom: activeTab === tab ? "2px solid #5925f4" : "2px solid transparent",
                marginBottom: "-1px",
              }}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "content" && (
          <>
            {/* Title */}
            <div className={FIELD}>
              <label className={LABEL} style={LS}>Page Title</label>
              <input className={INPUT} style={{ ...IS, fontSize: "1.1rem", fontWeight: 600 }}
                value={title} onChange={e => handleTitleChange(e.target.value)}
                placeholder="My New Page" />
            </div>

            {/* Slug */}
            <div className={FIELD}>
              <label className={LABEL} style={LS}>Slug</label>
              <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid var(--admin-border-strong)" }}>
                <span className="px-3 py-2 text-sm flex-shrink-0" style={{ background: "var(--admin-bg-elevated)", color: "var(--admin-text-subtle)", borderRight: "1px solid var(--admin-border-strong)" }}>
                  /pages/
                </span>
                <input className="flex-1 px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--admin-bg-deep)", color: "var(--admin-text-secondary)" }}
                  value={slug} onChange={e => setSlug(slugify(e.target.value))} />
              </div>
            </div>

            {/* Description */}
            <div className={FIELD}>
              <label className={LABEL} style={LS}>Short Description</label>
              <input className={INPUT} style={IS} value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Shown in listings and previews" />
            </div>

            {/* Blocks */}
            <div className="mt-6 mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--admin-text-subtle)" }}>
                Content Blocks ({blocks.length})
              </span>
              <button onClick={() => setShowBlockPicker(!showBlockPicker)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: "#5925f4", color: "#fff" }}>
                + Add Block
              </button>
            </div>

            {/* Block picker */}
            {showBlockPicker && (
              <div className="rounded-xl p-4 mb-4 grid grid-cols-4 gap-2" style={{ background: "var(--admin-bg-elevated)", border: "1px solid var(--admin-border)" }}>
                {BLOCK_TYPES.map(bt => (
                  <button key={bt.type} onClick={() => addBlock(bt.type)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-lg text-center transition-colors"
                    style={{ background: "#fff", border: "1px solid var(--admin-border)", color: "var(--admin-text-secondary)" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "#5925f4")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--admin-border)")}
                  >
                    <span className="text-lg">{bt.icon}</span>
                    <span className="text-xs font-medium">{bt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {blocks.length === 0 ? (
              <div className="rounded-xl p-8 text-center" style={{ background: "var(--admin-bg-elevated)", border: "2px dashed var(--admin-border)" }}>
                <p className="text-sm" style={{ color: "var(--admin-text-faint)" }}>No blocks yet — click "Add Block" to start building the page.</p>
              </div>
            ) : (
              blocks.map((block, idx) => (
                <BlockEditor
                  key={block.id}
                  block={block}
                  onChange={updated => updateBlock(block.id, updated)}
                  onDelete={() => deleteBlock(block.id)}
                  onMoveUp={() => moveBlock(idx, -1)}
                  onMoveDown={() => moveBlock(idx, 1)}
                  isFirst={idx === 0}
                  isLast={idx === blocks.length - 1}
                />
              ))
            )}
          </>
        )}

        {activeTab === "settings" && (
          <>
            <div className="rounded-xl p-6 mb-6" style={{ background: "var(--admin-bg-elevated)", border: "1px solid var(--admin-border)" }}>
              <h2 className="text-sm font-semibold mb-5" style={{ color: "var(--admin-text-primary)" }}>Page Settings</h2>
              <div className={FIELD}>
                <label className={LABEL} style={LS}>Status</label>
                <select className={INPUT} style={IS} value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className={FIELD}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={showInMenu} onChange={e => setShowInMenu(e.target.checked)} />
                    <div className="w-10 h-6 rounded-full transition-colors" style={{ background: showInMenu ? "#5925f4" : "var(--admin-border-strong)" }}>
                      <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform"
                        style={{ transform: showInMenu ? "translateX(16px)" : "translateX(0)" }} />
                    </div>
                  </div>
                  <span className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>Show in navigation menu</span>
                </label>
              </div>
            </div>
            <SeoPanel
              seoTitle={metaTitle}
              seoDesc={metaDesc}
              ogImage={ogImage}
              defaultTitle={title}
              defaultDesc={description}
              onChange={(field, value) => {
                if (field === "seo_title") setMetaTitle(value);
                else if (field === "seo_desc") setMetaDesc(value);
                else setOgImage(value);
                setIsDirty(true);
              }}
            />
          </>
        )}
      </div>

      {/* Sidebar actions */}
      <div className="w-56 flex-shrink-0 sticky top-6">
        <div className="rounded-xl p-4 mb-4" style={{ background: "#fff", border: "1px solid var(--admin-border)", boxShadow: "var(--admin-shadow-card)" }}>
          <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--admin-text-subtle)" }}>Publish</div>

          <div className="mb-3">
            <span className="text-xs" style={{ color: "var(--admin-text-subtle)" }}>Status: </span>
            <span className="text-xs font-bold" style={{ color: status === "published" ? "var(--admin-success)" : "var(--admin-text-faint)" }}>
              {status === "published" ? "● Published" : "○ Draft"}
            </span>
          </div>

          {error && <div className="admin-alert admin-alert-error mb-3 text-xs">{error}</div>}
          {success && <div className="admin-alert admin-alert-success mb-3 text-xs">{success}</div>}

          <button onClick={() => handleSave()} disabled={saving}
            className="admin-btn admin-btn-secondary w-full mb-2"
            style={{ opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : "Save Draft"}
          </button>

          {status !== "published" && (
            <button onClick={() => handleSave(true)} disabled={saving}
              className="admin-btn admin-btn-primary w-full mb-2"
              style={{ opacity: saving ? 0.6 : 1 }}>
              Publish
            </button>
          )}

          {isDirty && (
            <div className="mt-2 text-xs text-center" style={{ color: "var(--admin-warning-light)" }}>Unsaved changes</div>
          )}

          <button onClick={() => router.push("/admin/cms/pages")}
            className="admin-btn admin-btn-ghost w-full">
            ← Back to pages
          </button>
        </div>

        {!isNew && (
          <div className="rounded-xl p-4" style={{ background: "#fff", border: "1px solid var(--admin-border)", boxShadow: "var(--admin-shadow-card)" }}>
            <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--admin-text-subtle)" }}>Danger Zone</div>
            <button onClick={handleDelete} disabled={deleting}
              className="admin-btn admin-btn-danger w-full">
              {deleting ? "Deleting…" : "Delete Page"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
