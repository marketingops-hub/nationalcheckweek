"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { adminFetch } from "@/lib/adminFetch";
import type { Speaker } from "@/lib/events";

export default function SpeakerCard({ speaker, idx, onChange, onRemove }: {
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
      const res = await adminFetch("/api/admin/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Upload failed");
      onChange(idx, "photo", d.url);
    } catch (err) {
      console.error("Speaker photo upload failed:", err);
    } finally { setUploading(false); }
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
