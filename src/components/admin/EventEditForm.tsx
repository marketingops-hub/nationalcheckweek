"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FORMATS, STATUSES, type Speaker } from "@/lib/events";
import RichTextEditor from "@/components/admin/RichTextEditor";

interface EventForm {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  body: string;
  event_date: string;
  event_time: string;
  event_end: string;
  format: string;
  location: string;
  feature_image: string;
  is_free: boolean;
  price: string;
  register_url: string;
  recording_url: string;
  status: string;
  published: boolean;
  seo_title: string;
  seo_desc: string;
}

interface Props {
  event?: EventForm & { id: string; event_speakers?: Speaker[] };
}

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const EMPTY: EventForm = {
  slug: "", title: "", tagline: "", description: "", body: "",
  event_date: "", event_time: "", event_end: "", format: "webinar",
  location: "", feature_image: "", is_free: true, price: "",
  register_url: "", recording_url: "", status: "upcoming",
  published: false, seo_title: "", seo_desc: "",
};

const I = "swa-form-input";
const T = "swa-form-textarea";

export default function EventEditForm({ event }: Props) {
  const router = useRouter();
  const isNew = !event;
  const [form, setForm] = useState<EventForm>(event ? {
    slug: event.slug, title: event.title, tagline: event.tagline,
    description: event.description, body: event.body,
    event_date: event.event_date ?? "", event_time: event.event_time,
    event_end: event.event_end, format: event.format, location: event.location,
    feature_image: event.feature_image, is_free: event.is_free, price: event.price,
    register_url: event.register_url, recording_url: event.recording_url,
    status: event.status, published: event.published,
    seo_title: event.seo_title, seo_desc: event.seo_desc,
  } : { ...EMPTY });

  const [speakers, setSpeakers] = useState<Speaker[]>(
    (event?.event_speakers ?? []).sort((a, b) => a.sort_order - b.sort_order)
  );
  const [tab, setTab] = useState<"details" | "content" | "speakers" | "seo">("details");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [autoSlug, setAutoSlug] = useState(isNew);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof EventForm>(k: K, v: EventForm[K]) {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === "title" && autoSlug) next.slug = slugify(v as string);
      return next;
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new window.FormData();
      fd.append("file", file);
      fd.append("folder", "events");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Upload failed");
      set("feature_image", d.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.slug.trim())  { setError("Slug is required");  return; }
    setSaving(true); setError(""); setSuccess("");

    const payload = { ...form, speakers };
    const url = isNew ? "/api/admin/events" : `/api/admin/events/${event!.id}`;
    const method = isNew ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Save failed"); setSaving(false); return; }
    setSaving(false);
    if (isNew) {
      router.push(`/admin/events/${data.id}`);
    } else {
      setSuccess("✓ Saved successfully");
      setTimeout(() => setSuccess(""), 3000);
    }
  }

  // ── Speaker helpers ──
  function addSpeaker() {
    setSpeakers((s) => [...s, { name: "", title: "", bio: "", photo: "", sort_order: s.length }]);
  }
  function updateSpeaker(idx: number, field: keyof Speaker, val: string) {
    setSpeakers((s) => s.map((sp, i) => i === idx ? { ...sp, [field]: val } : sp));
  }
  function removeSpeaker(idx: number) {
    setSpeakers((s) => s.filter((_, i) => i !== idx));
  }

  const TABS = [
    { id: "details",  label: "Details",  icon: "event" },
    { id: "content",  label: "Content",  icon: "article" },
    { id: "speakers", label: "Speakers", icon: "groups", count: speakers.length },
    { id: "seo",      label: "SEO",      icon: "search" },
  ] as const;

  return (
    <div>
      {/* TABS */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #E5E7EB", marginBottom: 28 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 18px", border: "none", background: "none", cursor: "pointer",
              fontSize: "0.85rem", fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? "#7C3AED" : "#6B7280",
              borderBottom: tab === t.id ? "2px solid #7C3AED" : "2px solid transparent",
              marginBottom: -1, display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{t.icon}</span>
            {t.label}
            {"count" in t && t.count > 0 && (
              <span style={{ background: "#7C3AED", color: "#fff", borderRadius: 100, fontSize: "0.7rem", padding: "1px 6px" }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* DETAILS TAB */}
      {tab === "details" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label className="swa-form-label">Title *</label>
              <input className={I} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Practical Strategies for Emotional Literacy…" />
            </div>
            <div>
              <label className="swa-form-label">Slug *</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input className={I} value={form.slug} onChange={(e) => { setAutoSlug(false); set("slug", e.target.value); }} placeholder="practical-strategies-webinar" style={{ flex: 1 }} />
                <button type="button" onClick={() => { setAutoSlug(true); set("slug", slugify(form.title)); }} className="swa-btn swa-btn--ghost" style={{ whiteSpace: "nowrap", fontSize: "0.78rem" }}>Auto</button>
              </div>
            </div>
          </div>

          <div>
            <label className="swa-form-label">Tagline</label>
            <input className={I} value={form.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="A short compelling subtitle for the event…" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div>
              <label className="swa-form-label">Date</label>
              <input type="date" className={I} value={form.event_date} onChange={(e) => set("event_date", e.target.value)} />
            </div>
            <div>
              <label className="swa-form-label">Start Time</label>
              <input className={I} value={form.event_time} onChange={(e) => set("event_time", e.target.value)} placeholder="10:00 AM AEST" />
            </div>
            <div>
              <label className="swa-form-label">End Time</label>
              <input className={I} value={form.event_end} onChange={(e) => set("event_end", e.target.value)} placeholder="11:30 AM AEST" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label className="swa-form-label">Format</label>
              <select className={I} value={form.format} onChange={(e) => set("format", e.target.value)}>
                {FORMATS.map((f) => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="swa-form-label">Status</label>
              <select className={I} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="swa-form-label">Location / Webinar URL</label>
            <input className={I} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="https://zoom.us/j/… or 123 Main St, Sydney NSW" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label className="swa-form-label">Registration URL</label>
              <input className={I} value={form.register_url} onChange={(e) => set("register_url", e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <label className="swa-form-label">Recording URL (past events)</label>
              <input className={I} value={form.recording_url} onChange={(e) => set("recording_url", e.target.value)} placeholder="https://…" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "flex-end" }}>
            <div>
              <label className="swa-form-label">Pricing</label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "10px 14px", border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff" }}>
                <input type="checkbox" checked={form.is_free} onChange={(e) => set("is_free", e.target.checked)} />
                <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>Free event</span>
              </label>
            </div>
            {!form.is_free && (
              <div>
                <label className="swa-form-label">Price</label>
                <input className={I} value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="$99" />
              </div>
            )}
          </div>

          {/* Feature Image */}
          <div>
            <label className="swa-form-label">Feature Image</label>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 160, height: 100, borderRadius: 10, overflow: "hidden", background: "#F3F4F6", flexShrink: 0 }}>
                {form.feature_image ? (
                  <Image src={form.feature_image} alt="Feature" width={160} height={100} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "2rem" }}>📅</div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <input className={I} value={form.feature_image} onChange={(e) => set("feature_image", e.target.value)} placeholder="https://… or upload below" style={{ marginBottom: 8 }} />
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                <button type="button" onClick={() => fileRef.current?.click()} className="swa-btn swa-btn--ghost" disabled={uploading} style={{ fontSize: "0.82rem" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span>
                  {uploading ? "Uploading…" : "Upload image"}
                </button>
              </div>
            </div>
          </div>

          {/* Published toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", background: form.published ? "#F0FDF4" : "#FFF7ED", borderRadius: 10, border: `1px solid ${form.published ? "#BBF7D0" : "#FDE68A"}` }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flex: 1 }}>
              <input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} style={{ width: 18, height: 18 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: form.published ? "#16A34A" : "#92400E" }}>
                  {form.published ? "Published — visible on site" : "Draft — hidden from public"}
                </div>
                <div style={{ fontSize: "0.78rem", color: form.published ? "#15803D" : "#B45309" }}>
                  {form.published ? "This event is live at /events/" + form.slug : "Toggle to make this event public"}
                </div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* CONTENT TAB */}
      {tab === "content" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Description */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <label className="swa-form-label" style={{ marginBottom: 0 }}>About the Event (short description)</label>
              <span style={{ fontSize: "0.72rem", color: form.description.length > 400 ? "#EF4444" : "#9CA3AF" }}>
                {form.description.length} / 500 chars
              </span>
            </div>
            <RichTextEditor
              value={form.description}
              onChange={(v) => set("description", v)}
              placeholder="This evidence-informed webinar is designed for primary school educators…"
              minHeight={120}
            />
          </div>

          {/* Body */}
          <div>
            <label className="swa-form-label">Full Body Content</label>
            <RichTextEditor
              value={form.body}
              onChange={(v) => set("body", v)}
              placeholder="Write the full event details here. Use H2/H3 for section headings, bullet or numbered lists for key points…"
              minHeight={280}
            />
          </div>
        </div>
      )}

      {/* SPEAKERS TAB */}
      {tab === "speakers" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <p style={{ fontSize: "0.85rem", color: "#6B7280" }}>Add the experts presenting at this event.</p>
            <button type="button" onClick={addSpeaker} className="swa-btn swa-btn--primary" style={{ fontSize: "0.82rem" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
              Add speaker
            </button>
          </div>
          {speakers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, display: "block", marginBottom: 12 }}>groups</span>
              No speakers added yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {speakers.map((sp, idx) => (
                <SpeakerCard key={idx} speaker={sp} idx={idx} onChange={updateSpeaker} onRemove={removeSpeaker} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* SEO TAB */}
      {tab === "seo" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label className="swa-form-label">SEO Title</label>
            <input className={I} value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} placeholder={form.title || "Event title for search engines"} />
          </div>
          <div>
            <label className="swa-form-label">SEO Description</label>
            <textarea className={T} rows={4} value={form.seo_desc} onChange={(e) => set("seo_desc", e.target.value)} placeholder="Short description for Google and social sharing…" />
          </div>
        </div>
      )}

      {/* SAVE BAR */}
      <div style={{
        marginTop: 32, padding: "16px 20px",
        background: "#F9FAFB", border: "1px solid #E5E7EB",
        borderRadius: 10, display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-end",
      }}>
        {error  && <span style={{ color: "#EF4444", fontSize: "0.85rem", marginRight: "auto" }}>{error}</span>}
        {success && <span style={{ color: "#16A34A", fontSize: "0.85rem", marginRight: "auto" }}>{success}</span>}
        <button type="button" onClick={() => router.push("/admin/events")} className="swa-btn swa-btn--ghost">
          Cancel
        </button>
        <button type="button" onClick={handleSave} className="swa-btn swa-btn--primary" disabled={saving}>
          {saving ? "Saving…" : isNew ? "Create event" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function SpeakerCard({ speaker, idx, onChange, onRemove }: {
  speaker: Speaker; idx: number;
  onChange: (idx: number, field: keyof Speaker, val: string) => void;
  onRemove: (idx: number) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new window.FormData();
      fd.append("file", file);
      fd.append("folder", "events/speakers");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Upload failed");
      onChange(idx, "photo", d.url);
    } catch { /* ignore */ }
    finally { setUploading(false); }
  }

  return (
    <div style={{ background: "#FAFAF9", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" }}>Speaker #{idx + 1}</span>
        <button type="button" onClick={() => onRemove(idx)} className="swa-btn swa-btn--ghost" style={{ color: "#EF4444", fontSize: "0.78rem" }}>Remove</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 16, marginBottom: 14 }}>
        <div>
          <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", background: "#F3F4F6", marginBottom: 8 }}>
            {speaker.photo ? (
              <Image src={speaker.photo} alt={speaker.name} width={80} height={80} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "1.8rem" }}>👤</div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
          <button type="button" onClick={() => fileRef.current?.click()} className="swa-btn swa-btn--ghost" disabled={uploading} style={{ fontSize: "0.72rem", padding: "4px 8px", width: "100%" }}>
            {uploading ? "…" : "Upload"}
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label className="swa-form-label">Name *</label>
            <input className="swa-form-input" value={speaker.name} onChange={(e) => onChange(idx, "name", e.target.value)} placeholder="Dr. Jane Smith" />
          </div>
          <div>
            <label className="swa-form-label">Title / Role</label>
            <input className="swa-form-input" value={speaker.title} onChange={(e) => onChange(idx, "title", e.target.value)} placeholder="CEO & Founder of Life Skills GO" />
          </div>
        </div>
      </div>
      <div>
        <label className="swa-form-label">Bio</label>
        <textarea className="swa-form-textarea" rows={4} value={speaker.bio} onChange={(e) => onChange(idx, "bio", e.target.value)} placeholder="20+ years experience in social-emotional literacy programs…" />
      </div>
    </div>
  );
}
