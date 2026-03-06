"use client";

import { useState } from "react";
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

const INPUT = "w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500";
const IS = { background: "#0D1117", border: "1px solid #30363D", color: "#C9D1D9" };
const LABEL = "block text-xs font-semibold mb-1.5 uppercase tracking-wide";
const LS = { color: "#6E7681" };

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
    await sb.from("menu_items").update({ is_active: !item.is_active }).eq("id", item.id);
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
    await Promise.all(newPositions.map(p => sb.from("menu_items").update({ position: p.position }).eq("id", p.id)));
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
        {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "#3D1515", color: "#F87171", border: "1px solid #7F1D1D" }}>{error}</div>}
        {success && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "#0D2D1A", color: "#6EE7B7", border: "1px solid #166534" }}>{success}</div>}

        {/* Live preview bar */}
        <div className="rounded-xl px-6 py-3 mb-6 flex items-center gap-6 overflow-x-auto" style={{ background: "#0B1D35", border: "1px solid #1E3A5F" }}>
          <span className="text-sm font-bold flex-shrink-0" style={{ color: "#FFFFFF" }}>
            <span style={{ color: "#22D3EE" }}>Schools</span>Wellbeing.com.au
          </span>
          {sorted.filter(i => !i.parent_id && i.is_active).map(item => (
            <span key={item.id} className="text-sm flex-shrink-0" style={{ color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap" }}>
              {item.label}
            </span>
          ))}
        </div>

        {/* Items */}
        <div className="space-y-2">
          {topLevel.length === 0 && (
            <div className="rounded-xl p-8 text-center" style={{ background: "#161B22", border: "2px dashed #21262D" }}>
              <p className="text-sm" style={{ color: "#484F58" }}>No menu items yet. Add your first item →</p>
            </div>
          )}

          {topLevel.map((item, idx) => {
            const children = sorted.filter(i => i.parent_id === item.id);
            return (
              <div key={item.id}>
                <div
                  className="rounded-xl flex items-center gap-3 px-4 py-3"
                  style={{
                    background: item.is_active ? "#0D1117" : "#161B22",
                    border: `1px solid ${item.is_active ? "#21262D" : "#30363D"}`,
                    opacity: item.is_active ? 1 : 0.6,
                  }}
                >
                  {/* Drag handle / order */}
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => handleMove(item, -1)} disabled={idx === 0}
                      className="text-xs px-1.5 rounded" style={{ background: "#21262D", color: idx === 0 ? "#30363D" : "#8B949E" }}>↑</button>
                    <button onClick={() => handleMove(item, 1)} disabled={idx === topLevel.length - 1}
                      className="text-xs px-1.5 rounded" style={{ background: "#21262D", color: idx === topLevel.length - 1 ? "#30363D" : "#8B949E" }}>↓</button>
                  </div>

                  <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{ background: "#21262D", color: "#6E7681" }}>
                    {item.position}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: "#E6EDF3" }}>{item.label}</span>
                      {item.target === "_blank" && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#21262D", color: "#8B949E" }}>↗ new tab</span>
                      )}
                      {item.page_id && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#1C2A3A", color: "#58A6FF" }}>CMS Page</span>
                      )}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "#484F58" }}>{item.href}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggle(item)}
                      className="text-xs font-bold px-2 py-1 rounded"
                      style={{
                        background: item.is_active ? "#0D2D1A" : "#21262D",
                        color: item.is_active ? "#6EE7B7" : "#484F58",
                        border: `1px solid ${item.is_active ? "#166534" : "#30363D"}`,
                      }}>
                      {item.is_active ? "Active" : "Hidden"}
                    </button>
                    <button onClick={() => openEdit(item)}
                      className="text-xs font-semibold px-3 py-1.5 rounded"
                      style={{ background: "#21262D", color: "#C9D1D9" }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(item)}
                      className="text-xs font-semibold px-3 py-1.5 rounded"
                      style={{ background: "#3D1515", color: "#F87171", border: "1px solid #7F1D1D" }}>
                      ✕
                    </button>
                  </div>
                </div>

                {/* Children (sub-items) */}
                {children.map(child => (
                  <div key={child.id} className="ml-10 mt-1 rounded-xl flex items-center gap-3 px-4 py-2.5"
                    style={{ background: "#161B22", border: "1px solid #21262D", opacity: child.is_active ? 1 : 0.5 }}>
                    <span className="text-xs" style={{ color: "#484F58" }}>└</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm" style={{ color: "#C9D1D9" }}>{child.label}</span>
                      <span className="text-xs ml-2" style={{ color: "#484F58" }}>{child.href}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggle(child)} className="text-xs font-bold px-2 py-1 rounded"
                        style={{ background: child.is_active ? "#0D2D1A" : "#21262D", color: child.is_active ? "#6EE7B7" : "#484F58" }}>
                        {child.is_active ? "Active" : "Hidden"}
                      </button>
                      <button onClick={() => openEdit(child)} className="text-xs font-semibold px-3 py-1.5 rounded"
                        style={{ background: "#21262D", color: "#C9D1D9" }}>Edit</button>
                      <button onClick={() => handleDelete(child)} className="text-xs font-semibold px-3 py-1.5 rounded"
                        style={{ background: "#3D1515", color: "#F87171", border: "1px solid #7F1D1D" }}>✕</button>
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
          <div className="rounded-xl p-5" style={{ background: "#161B22", border: "1px solid #21262D" }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "#E6EDF3" }}>
              {editId ? "Edit Item" : "Add Menu Item"}
            </h3>

            <div className="mb-4">
              <label className={LABEL} style={LS}>Label</label>
              <input className={INPUT} style={IS} value={form.label}
                onChange={e => setF("label", e.target.value)} placeholder="e.g. About Us" />
            </div>

            <div className="mb-4">
              <label className={LABEL} style={LS}>Link Type</label>
              <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid #30363D" }}>
                {(["custom", "page"] as const).map(t => (
                  <button key={t} onClick={() => setLinkType(t)}
                    className="flex-1 text-xs font-semibold py-2 capitalize"
                    style={{ background: linkType === t ? "#21262D" : "transparent", color: linkType === t ? "#E6EDF3" : "#6E7681" }}>
                    {t === "custom" ? "Custom URL" : "CMS Page"}
                  </button>
                ))}
              </div>
            </div>

            {linkType === "page" ? (
              <div className="mb-4">
                <label className={LABEL} style={LS}>Select Page</label>
                {pages.length === 0 ? (
                  <p className="text-xs" style={{ color: "#484F58" }}>No published pages yet. Create one in Pages first.</p>
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
              <label className={LABEL} style={LS}>Parent Item <span style={{ color: "#484F58", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>(optional)</span></label>
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

            {error && <div className="mb-3 px-3 py-2 rounded text-xs" style={{ background: "#3D1515", color: "#F87171" }}>{error}</div>}

            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 text-sm font-semibold py-2 rounded-lg"
                style={{ background: "#238636", color: "#FFFFFF", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Saving…" : editId ? "Update" : "Add"}
              </button>
              <button onClick={() => { setShowAdd(false); clearMessages(); }}
                className="flex-1 text-sm font-semibold py-2 rounded-lg"
                style={{ background: "#21262D", color: "#C9D1D9" }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-5" style={{ background: "#161B22", border: "1px solid #21262D" }}>
            <p className="text-xs mb-4" style={{ color: "#6E7681" }}>
              {items.length} item{items.length !== 1 ? "s" : ""} in the navigation. Changes are saved immediately to the database and reflected on the live site.
            </p>
            <button onClick={openAdd}
              className="w-full text-sm font-semibold py-2.5 rounded-lg"
              style={{ background: "#238636", color: "#FFFFFF" }}>
              + Add Menu Item
            </button>

            {success && <div className="mt-4 px-3 py-2 rounded text-xs" style={{ background: "#0D2D1A", color: "#6EE7B7", border: "1px solid #166534" }}>{success}</div>}
          </div>
        )}

        <div className="mt-4 rounded-xl p-4" style={{ background: "#161B22", border: "1px solid #21262D" }}>
          <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "#58A6FF" }}>Tips</div>
          <ul className="text-xs space-y-1.5" style={{ color: "#6E7681" }}>
            <li>• Use <code style={{ color: "#8B949E" }}>/#section</code> to link to homepage anchors</li>
            <li>• Set a Parent Item to create dropdown sub-menus</li>
            <li>• Toggle Active/Hidden without deleting</li>
            <li>• Changes go live instantly — no rebuild needed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
