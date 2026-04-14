"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface MenuItem {
  id: string;
  label: string;
  href: string;
  page_id: string | null;
  parent_id: string | null;
  position: number;
  target: string;
  is_active: boolean;
}

interface Page {
  id: string;
  slug: string;
  title: string;
  status: string;
}

const INPUT = "w-full rounded-lg px-3 py-2 text-sm outline-none";
const IS: React.CSSProperties = { background: "#fff", border: "1px solid var(--admin-border-strong)", color: "var(--admin-text-primary)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" };
const LABEL = "block text-xs font-semibold mb-1.5 uppercase tracking-wide";
const LS: React.CSSProperties = { color: "var(--admin-text-subtle)" };

function uid() { return Math.random().toString(36).slice(2, 10); }

const BLANK_ITEM: Omit<MenuItem, "id"> = {
  label: "",
  href: "",
  page_id: null,
  parent_id: null,
  position: 0,
  target: "_self",
  is_active: true,
};

export default function MenuManager({ initialItems, pages }: { initialItems: MenuItem[]; pages: Page[] }) {
  const [items, setItems] = useState<MenuItem[]>(
    [...initialItems].sort((a, b) => a.position - b.position)
  );
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<MenuItem, "id">>({ ...BLANK_ITEM });
  const [linkType, setLinkType] = useState<"custom" | "page">("custom");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function clearMessages() { setError(""); setSuccess(""); }

  function setF(key: keyof Omit<MenuItem, "id">, value: string | boolean | null) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function openAdd() {
    setForm({ ...BLANK_ITEM, position: items.length + 1 });
    setLinkType("custom");
    setEditId(null);
    setShowAdd(true);
    clearMessages();
  }

  function openEdit(item: MenuItem) {
    setForm({ label: item.label, href: item.href, page_id: item.page_id, parent_id: item.parent_id, position: item.position, target: item.target, is_active: item.is_active });
    setLinkType(item.page_id ? "page" : "custom");
    setEditId(item.id);
    setShowAdd(true);
    clearMessages();
  }

  function handlePageSelect(pageId: string) {
    const pg = pages.find(p => p.id === pageId);
    setF("page_id", pageId);
    if (pg) setF("href", `/pages/${pg.slug}`);
  }

  async function handleSave() {
    if (!form.label.trim()) { setError("Label is required."); return; }
    if (!form.href.trim() && !form.page_id) { setError("URL or page selection is required."); return; }
    setSaving(true); clearMessages();

    const sb = createClient();
    const payload = {
      label: form.label.trim(),
      href: form.href.trim(),
      page_id: linkType === "page" ? form.page_id : null,
      parent_id: form.parent_id || null,
      position: form.position,
      target: form.target,
      is_active: form.is_active,
    };

    if (editId) {
      const { error: err } = await sb.from("menu_items").update(payload).eq("id", editId);
      if (err) { setError(err.message); setSaving(false); return; }
      setItems(its => its.map(i => i.id === editId ? { ...i, ...payload } : i));
      setSuccess("✓ Menu item updated");
    } else {
      const { data, error: err } = await sb.from("menu_items").insert(payload).select().single();
      if (err) { setError(err.message); setSaving(false); return; }
      setItems(its => [...its, data].sort((a, b) => a.position - b.position));
      setSuccess("✓ Menu item added");
    }

    setShowAdd(false);
    setSaving(false);
  }

  async function handleDelete(item: MenuItem) {
    if (!confirm(`Remove "${item.label}" from the menu?`)) return;
    const sb = createClient();
    const { error: err } = await sb.from("menu_items").delete().eq("id", item.id);
    if (err) { setError(err.message); return; }
    setItems(its => its.filter(i => i.id !== item.id));
    setSuccess(`✓ "${item.label}" removed`);
  }

  async function handleToggle(item: MenuItem) {
    const sb = createClient();
    const { error: err } = await sb.from("menu_items").update({ is_active: !item.is_active }).eq("id", item.id);
    if (err) { setError(err.message); return; }
    setItems(its => its.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
  }

  async function handleMove(item: MenuItem, dir: -1 | 1) {
    const sorted = [...items].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex(i => i.id === item.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const other = sorted[swapIdx];
    const newPositions = [
      { id: item.id, position: other.position },
      { id: other.id, position: item.position },
    ];

    const sb = createClient();
    const results = await Promise.all(newPositions.map(p => sb.from("menu_items").update({ position: p.position }).eq("id", p.id)));
    const moveErr = results.find(r => r.error)?.error;
    if (moveErr) { setError(moveErr.message); return; }
    setItems(its => its.map(i => {
      const np = newPositions.find(p => p.id === i.id);
      return np ? { ...i, position: np.position } : i;
    }).sort((a, b) => a.position - b.position));
  }

  const sorted = [...items].sort((a, b) => a.position - b.position);
  const topLevel = sorted.filter(i => !i.parent_id);

  return (
    <div className="flex gap-6 items-start">
      {/* Menu tree */}
      <div className="flex-1 min-w-0">
        {error && <div className="admin-alert admin-alert-error mb-4">{error}</div>}
        {success && <div className="admin-alert admin-alert-success mb-4">{success}</div>}

        {/* Live preview bar */}
        <div className="rounded-xl px-6 py-3 mb-6 flex items-center gap-6 overflow-x-auto" style={{ background: "linear-gradient(135deg, #5925f4, #7c56ff)", border: "none" }}>
          <span className="text-sm font-bold flex-shrink-0 text-white">
            National Check-in Week
          </span>
          {sorted.filter(i => !i.parent_id && i.is_active).map(item => (
            <span key={item.id} className="text-sm flex-shrink-0" style={{ color: "rgba(255,255,255,0.8)", whiteSpace: "nowrap" }}>
              {item.label}
            </span>
          ))}
        </div>

        {/* Items */}
        <div className="space-y-2">
          {topLevel.length === 0 && (
            <div className="rounded-xl p-8 text-center" style={{ background: "var(--admin-bg-elevated)", border: "2px dashed var(--admin-border)" }}>
              <p className="text-sm" style={{ color: "var(--admin-text-faint)" }}>No menu items yet. Add your first item →</p>
            </div>
          )}

          {topLevel.map((item, idx) => {
            const children = sorted.filter(i => i.parent_id === item.id);
            return (
              <div key={item.id}>
                <div
                  className="rounded-xl flex items-center gap-3 px-4 py-3"
                  style={{
                    background: "#fff",
                    border: `1px solid var(--admin-border)`,
                    opacity: item.is_active ? 1 : 0.6,
                  }}
                >
                  {/* Drag handle / order */}
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => handleMove(item, -1)} disabled={idx === 0}
                      className="text-xs px-1.5 rounded" style={{ background: "var(--admin-bg-deep)", color: idx === 0 ? "var(--admin-border-strong)" : "var(--admin-text-muted)" }}>↑</button>
                    <button onClick={() => handleMove(item, 1)} disabled={idx === topLevel.length - 1}
                      className="text-xs px-1.5 rounded" style={{ background: "var(--admin-bg-deep)", color: idx === topLevel.length - 1 ? "var(--admin-border-strong)" : "var(--admin-text-muted)" }}>↓</button>
                  </div>

                  <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{ background: "rgba(89,37,244,0.1)", color: "#5925f4" }}>
                    {item.position}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: "var(--admin-text-primary)" }}>{item.label}</span>
                      {item.target === "_blank" && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--admin-bg-elevated)", color: "var(--admin-text-muted)" }}>↗ new tab</span>
                      )}
                      {item.page_id && (
                        <span className="admin-badge admin-badge-indigo">CMS Page</span>
                      )}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--admin-text-faint)" }}>{item.href}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggle(item)}
                      className={`admin-badge cursor-pointer ${item.is_active ? "admin-badge-green" : "admin-badge-slate"}`}>
                      {item.is_active ? "Active" : "Hidden"}
                    </button>
                    <button onClick={() => openEdit(item)} className="admin-icon-btn" title="Edit">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => handleDelete(item)} className="admin-icon-btn" title="Remove" style={{ color: "var(--admin-danger)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                    </button>
                  </div>
                </div>

                {/* Children (sub-items) */}
                {children.map(child => (
                  <div key={child.id} className="ml-10 mt-1 rounded-xl flex items-center gap-3 px-4 py-2.5"
                    style={{ background: "var(--admin-bg-elevated)", border: "1px solid var(--admin-border)", opacity: child.is_active ? 1 : 0.5 }}>
                    <span className="text-xs" style={{ color: "var(--admin-text-faint)" }}>└</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm" style={{ color: "var(--admin-text-secondary)" }}>{child.label}</span>
                      <span className="text-xs ml-2" style={{ color: "var(--admin-text-faint)" }}>{child.href}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggle(child)}
                        className={`admin-badge cursor-pointer ${child.is_active ? "admin-badge-green" : "admin-badge-slate"}`}>
                        {child.is_active ? "Active" : "Hidden"}
                      </button>
                      <button onClick={() => openEdit(child)} className="admin-icon-btn" title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => handleDelete(child)} className="admin-icon-btn" title="Remove" style={{ color: "var(--admin-danger)" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      <div className="w-72 flex-shrink-0 sticky top-6">
        {showAdd ? (
          <div className="rounded-xl p-5" style={{ background: "#fff", border: "1px solid var(--admin-border)", boxShadow: "var(--admin-shadow-card)" }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--admin-text-primary)" }}>
              {editId ? "Edit Item" : "Add Menu Item"}
            </h3>

            <div className="mb-4">
              <label className={LABEL} style={LS}>Label</label>
              <input className={INPUT} style={IS} value={form.label}
                onChange={e => setF("label", e.target.value)} placeholder="e.g. About Us" />
            </div>

            <div className="mb-4">
              <label className={LABEL} style={LS}>Link Type</label>
              <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--admin-border-strong)" }}>
                {(["custom", "page"] as const).map(t => (
                  <button key={t} onClick={() => setLinkType(t)}
                    className="flex-1 text-xs font-semibold py-2 capitalize"
                    style={{ background: linkType === t ? "rgba(89,37,244,0.1)" : "transparent", color: linkType === t ? "#5925f4" : "var(--admin-text-subtle)" }}>
                    {t === "custom" ? "Custom URL" : "CMS Page"}
                  </button>
                ))}
              </div>
            </div>

            {linkType === "page" ? (
              <div className="mb-4">
                <label className={LABEL} style={LS}>Select Page</label>
                {pages.length === 0 ? (
                  <p className="text-xs" style={{ color: "var(--admin-text-faint)" }}>No published pages yet. Create one in Pages first.</p>
                ) : (
                  <select className={INPUT} style={IS}
                    value={form.page_id ?? ""}
                    onChange={e => handlePageSelect(e.target.value)}>
                    <option value="">— select a page —</option>
                    {pages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <label className={LABEL} style={LS}>URL</label>
                <input className={INPUT} style={IS} value={form.href}
                  onChange={e => setF("href", e.target.value)} placeholder="/#map or /about or https://..." />
              </div>
            )}

            <div className="mb-4">
              <label className={LABEL} style={LS}>Parent Item <span style={{ color: "var(--admin-text-faint)", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>(optional)</span></label>
              <select className={INPUT} style={IS}
                value={form.parent_id ?? ""}
                onChange={e => setF("parent_id", e.target.value || null)}>
                <option value="">— top level —</option>
                {items.filter(i => !i.parent_id).map(i => (
                  <option key={i.id} value={i.id}>{i.label}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className={LABEL} style={LS}>Open In</label>
              <select className={INPUT} style={IS} value={form.target} onChange={e => setF("target", e.target.value)}>
                <option value="_self">Same tab</option>
                <option value="_blank">New tab</option>
              </select>
            </div>

            <div className="mb-5">
              <label className={LABEL} style={LS}>Position</label>
              <input type="number" className={INPUT} style={IS} value={form.position}
                onChange={e => setF("position", e.target.value)} min={1} />
            </div>

            {error && <div className="admin-alert admin-alert-error mb-3 text-xs">{error}</div>}

            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="admin-btn admin-btn-primary flex-1"
                style={{ opacity: saving ? 0.6 : 1 }}>
                {saving ? "Saving…" : editId ? "Update" : "Add"}
              </button>
              <button onClick={() => { setShowAdd(false); clearMessages(); }}
                className="admin-btn admin-btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-5" style={{ background: "#fff", border: "1px solid var(--admin-border)", boxShadow: "var(--admin-shadow-card)" }}>
            <p className="text-xs mb-4" style={{ color: "var(--admin-text-subtle)" }}>
              {items.length} item{items.length !== 1 ? "s" : ""} in the navigation. Changes are saved immediately to the database and reflected on the live site.
            </p>
            <button onClick={openAdd} className="admin-btn admin-btn-primary w-full">
              + Add Menu Item
            </button>

            {success && <div className="admin-alert admin-alert-success mt-4">{success}</div>}
          </div>
        )}

        <div className="mt-4 rounded-xl p-4" style={{ background: "var(--admin-bg-elevated)", border: "1px solid var(--admin-border)" }}>
          <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--admin-accent)" }}>Tips</div>
          <ul className="text-xs space-y-1.5" style={{ color: "var(--admin-text-subtle)" }}>
            <li>• Use <code style={{ color: "var(--admin-text-muted)" }}>/#section</code> to link to homepage anchors</li>
            <li>• Set a Parent Item to create dropdown sub-menus</li>
            <li>• Toggle Active/Hidden without deleting</li>
            <li>• Changes go live instantly — no rebuild needed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
