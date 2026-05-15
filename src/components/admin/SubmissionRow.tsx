"use client";

import { useEffect, useState } from "react";

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Application {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  organisation: string | null;
  role_title: string | null;
  state: string | null;
  category_id: string | null;
  ambassador_categories: Category | null;
  why_ambassador: string;
  experience: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export interface Nomination {
  id: string;
  nominee_first_name: string;
  nominee_last_name: string;
  nominee_email: string | null;
  nominee_phone: string | null;
  nominee_organisation: string | null;
  nominee_role_title: string | null;
  nominee_state: string | null;
  category_id: string | null;
  ambassador_categories: Category | null;
  reason: string;
  nominee_linkedin: string | null;
  nominator_name: string;
  nominator_email: string;
  nominator_phone: string | null;
  nominator_relation: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export const APP_STATUSES  = ["new", "reviewing", "approved", "declined"] as const;
export const NOM_STATUSES  = ["new", "reviewing", "contacted", "approved", "declined"] as const;

export const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  new:       { bg: "#EFF6FF", color: "#1D4ED8" },
  reviewing: { bg: "#FEF3C7", color: "#B45309" },
  contacted: { bg: "#F0FDF4", color: "#15803D" },
  approved:  { bg: "#DCFCE7", color: "#15803D" },
  declined:  { bg: "#FEE2E2", color: "#B91C1C" },
};

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? { bg: "#F3F4F6", color: "#6B7280" };
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, textTransform: "capitalize", whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

export function ApplicationRow({ item, onUpdate, onDelete }: {
  item: Application;
  onUpdate: (id: string, patch: Partial<Application>) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes]       = useState(item.admin_notes ?? "");
  const [saving, setSaving]     = useState(false);
  const cat = item.ambassador_categories;

  useEffect(() => { setNotes(item.admin_notes ?? ""); }, [item.admin_notes]);

  async function saveNotes() {
    setSaving(true);
    const res = await fetch(`/api/admin/submissions/${item.id}?type=applications`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_notes: notes }),
    });
    if (res.ok) onUpdate(item.id, { admin_notes: notes });
    setSaving(false);
  }

  async function setStatus(status: string) {
    const res = await fetch(`/api/admin/submissions/${item.id}?type=applications`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) onUpdate(item.id, { status });
  }

  async function del() {
    if (!confirm(`Delete application from ${item.first_name} ${item.last_name}?`)) return;
    const res = await fetch(`/api/admin/submissions/${item.id}?type=applications`, { method: "DELETE" });
    if (res.ok) onDelete(item.id);
  }

  return (
    <div style={{ borderBottom: "1px solid var(--color-border)" }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", background: expanded ? "var(--color-primary-pale)" : "transparent" }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text-primary)" }}>
            {item.first_name} {item.last_name}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-faint)", display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
            <span>{item.email}</span>
            {item.organisation && <span>· {item.organisation}</span>}
            {item.role_title   && <span>· {item.role_title}</span>}
            {item.state        && <span>· {item.state}</span>}
          </div>
        </div>
        {cat && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: cat.color + "18", color: cat.color, border: `1px solid ${cat.color}33`, whiteSpace: "nowrap" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{cat.icon}</span>
            {cat.name}
          </span>
        )}
        <StatusBadge status={item.status} />
        <span style={{ fontSize: 11, color: "var(--color-text-faint)", whiteSpace: "nowrap" }}>{timeAgo(item.created_at)}</span>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--color-text-faint)" }}>{expanded ? "expand_less" : "expand_more"}</span>
      </div>

      {expanded && (
        <div style={{ padding: "16px 20px", background: "var(--color-primary-pale)", borderTop: "1px solid var(--color-border-light)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-faint)", marginBottom: 6 }}>Why they want to be an Ambassador</div>
              <p style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.75, margin: 0 }}>{item.why_ambassador}</p>
            </div>
            {item.experience && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-faint)", marginBottom: 6 }}>Experience</div>
                <p style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.75, margin: 0 }}>{item.experience}</p>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {item.phone        && <a href={`tel:${item.phone}`} style={{ fontSize: 12, color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>📞 {item.phone}</a>}
            {item.linkedin_url && <a href={item.linkedin_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>🔗 LinkedIn</a>}
            {item.website_url  && <a href={item.website_url}  target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>🌐 Website</a>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-faint)", marginBottom: 6 }}>Admin Notes</div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", fontSize: 13, fontFamily: "inherit", resize: "vertical" }}
                placeholder="Internal notes..." />
            </div>
            <button onClick={saveNotes} disabled={saving} className="swa-btn" style={{ padding: "8px 16px", fontSize: 12, fontWeight: 600, border: "1px solid var(--color-border)", background: "var(--color-card)", cursor: "pointer", whiteSpace: "nowrap" }}>
              {saving ? "Saving…" : "Save Notes"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "var(--color-text-faint)", fontWeight: 600, marginRight: 4 }}>Set status:</span>
              {APP_STATUSES.map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
                    border: `1px solid ${item.status === s ? (STATUS_COLORS[s]?.color ?? "#ccc") : "var(--color-border)"}`,
                    background: item.status === s ? (STATUS_COLORS[s]?.bg ?? "#f3f4f6") : "var(--color-card)",
                    color: item.status === s ? (STATUS_COLORS[s]?.color ?? "#333") : "var(--color-text-muted)" }}>
                  {s}
                </button>
              ))}
            </div>
            <button onClick={del} style={{ fontSize: 12, color: "var(--color-error)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function NominationRow({ item, onUpdate, onDelete }: {
  item: Nomination;
  onUpdate: (id: string, patch: Partial<Nomination>) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes]       = useState(item.admin_notes ?? "");
  const [saving, setSaving]     = useState(false);
  const cat = item.ambassador_categories;

  useEffect(() => { setNotes(item.admin_notes ?? ""); }, [item.admin_notes]);

  async function saveNotes() {
    setSaving(true);
    const res = await fetch(`/api/admin/submissions/${item.id}?type=nominations`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_notes: notes }),
    });
    if (res.ok) onUpdate(item.id, { admin_notes: notes });
    setSaving(false);
  }

  async function setStatus(status: string) {
    const res = await fetch(`/api/admin/submissions/${item.id}?type=nominations`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) onUpdate(item.id, { status });
  }

  async function del() {
    if (!confirm(`Delete nomination of ${item.nominee_first_name} ${item.nominee_last_name}?`)) return;
    const res = await fetch(`/api/admin/submissions/${item.id}?type=nominations`, { method: "DELETE" });
    if (res.ok) onDelete(item.id);
  }

  return (
    <div style={{ borderBottom: "1px solid var(--color-border)" }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", background: expanded ? "var(--color-primary-pale)" : "transparent" }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--color-text-primary)" }}>
            {item.nominee_first_name} {item.nominee_last_name}
            <span style={{ fontWeight: 400, fontSize: 12, color: "var(--color-text-faint)", marginLeft: 8 }}>nominated by {item.nominator_name}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-faint)", display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
            {item.nominee_organisation && <span>{item.nominee_organisation}</span>}
            {item.nominee_role_title   && <span>· {item.nominee_role_title}</span>}
            {item.nominee_state        && <span>· {item.nominee_state}</span>}
          </div>
        </div>
        {cat && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: cat.color + "18", color: cat.color, border: `1px solid ${cat.color}33`, whiteSpace: "nowrap" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{cat.icon}</span>
            {cat.name}
          </span>
        )}
        <StatusBadge status={item.status} />
        <span style={{ fontSize: 11, color: "var(--color-text-faint)", whiteSpace: "nowrap" }}>{timeAgo(item.created_at)}</span>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--color-text-faint)" }}>{expanded ? "expand_less" : "expand_more"}</span>
      </div>

      {expanded && (
        <div style={{ padding: "16px 20px", background: "var(--color-primary-pale)", borderTop: "1px solid var(--color-border-light)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-faint)", marginBottom: 6 }}>Reason for Nomination</div>
              <p style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.75, margin: 0 }}>{item.reason}</p>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-faint)", marginBottom: 8 }}>Nominee Contact</div>
              <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.9 }}>
                {item.nominee_email  && <div>📧 <a href={`mailto:${item.nominee_email}`} style={{ color: "var(--color-primary)" }}>{item.nominee_email}</a></div>}
                {item.nominee_phone  && <div>📞 {item.nominee_phone}</div>}
                {item.nominee_linkedin && <div>🔗 <a href={item.nominee_linkedin} target="_blank" rel="noreferrer" style={{ color: "var(--color-primary)" }}>LinkedIn</a></div>}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-faint)", marginBottom: 8, marginTop: 12 }}>Nominator</div>
              <div style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.9 }}>
                <div>{item.nominator_name} {item.nominator_relation && <span style={{ color: "var(--color-text-faint)" }}>({item.nominator_relation})</span>}</div>
                <div>📧 <a href={`mailto:${item.nominator_email}`} style={{ color: "var(--color-primary)" }}>{item.nominator_email}</a></div>
                {item.nominator_phone && <div>📞 {item.nominator_phone}</div>}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--color-text-faint)", marginBottom: 6 }}>Admin Notes</div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", fontSize: 13, fontFamily: "inherit", resize: "vertical" }}
                placeholder="Internal notes..." />
            </div>
            <button onClick={saveNotes} disabled={saving} className="swa-btn" style={{ padding: "8px 16px", fontSize: 12, fontWeight: 600, border: "1px solid var(--color-border)", background: "var(--color-card)", cursor: "pointer", whiteSpace: "nowrap" }}>
              {saving ? "Saving…" : "Save Notes"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "var(--color-text-faint)", fontWeight: 600, marginRight: 4 }}>Set status:</span>
              {NOM_STATUSES.map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
                    border: `1px solid ${item.status === s ? (STATUS_COLORS[s]?.color ?? "#ccc") : "var(--color-border)"}`,
                    background: item.status === s ? (STATUS_COLORS[s]?.bg ?? "#f3f4f6") : "var(--color-card)",
                    color: item.status === s ? (STATUS_COLORS[s]?.color ?? "#333") : "var(--color-text-muted)" }}>
                  {s}
                </button>
              ))}
            </div>
            <button onClick={del} style={{ fontSize: 12, color: "var(--color-error)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}
