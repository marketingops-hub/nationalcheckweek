"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminFetch";
import { FIELDS, FIELD_LABELS, type EntityType } from "@/lib/pageRefresh/entities";

interface PreviewSource {
  id: string;
  title: string;
  label: string;
  url: string | null;
  year: string | null;
  cited: boolean;
}

interface EvidenceItem {
  sourceId: string;
  label: string;
  url: string | null;
  page: number | null;
  heading: string | null;
  quote: string;
  verified: boolean;
}

interface Preview {
  subject: string;
  current: Record<string, unknown>;
  proposed: Record<string, unknown>;
  changed: string[];
  sources: PreviewSource[];
  evidence: Record<string, EvidenceItem[]>;
  unsupported: Record<string, string[]>;
  warnings: string[];
}

interface Version {
  id: string;
  version: number;
  origin: "baseline" | "refresh" | "revert";
  note: string | null;
  content: Record<string, unknown>;
  source_count: number;
  created_at: string;
  created_by_email: string | null;
}

interface Props {
  entityType: EntityType;
  /** areas.slug, or "<state-slug>/<issue-slug>" for a state's issue page. */
  entityKey: string;
  /** Public path of the page, for the "View on site" link. */
  pagePath: string;
  /** When set, the actions are disabled and this explains why (e.g. unsaved edits). */
  blockedReason?: string | null;
}

/** The admin theme stretches bare inputs to full width; keep checkboxes small. */
const checkbox = { width: 16, height: 16, flex: "none", margin: 0, padding: 0 } as const;

/** The preview is an AI call; the default 30s browser timeout is far too short. */
const PREVIEW_TIMEOUT_MS = 150_000;

const ORIGIN_LABEL: Record<Version["origin"], string> = {
  baseline: "Original",
  refresh: "Vault refresh",
  revert: "Revert",
};

const muted = { color: "var(--admin-text-subtle)" } as const;
const box = {
  border: "1px solid var(--admin-border)",
  borderRadius: 8,
  padding: "12px 14px",
  background: "var(--admin-bg-elevated, transparent)",
} as const;

function when(iso: string) {
  return new Date(iso).toLocaleString("en-AU", { timeZone: "Australia/Sydney", dateStyle: "medium", timeStyle: "short" });
}

function Value({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    return (
      <div style={{ fontSize: 13, lineHeight: 1.6 }}>
        {value.map((v, i) => {
          const s = v as { num?: string; label?: string; name?: string; stat?: string; desc?: string };
          if (s.name !== undefined) {
            return (
              <div key={i} style={{ marginBottom: 8 }}>
                <strong>{s.name}</strong>
                <div><strong>{s.stat}</strong></div>
                <div style={{ whiteSpace: "pre-wrap" }}>{s.desc}</div>
              </div>
            );
          }
          return <div key={i}>• <strong>{s.num}</strong> — {s.label}</div>;
        })}
      </div>
    );
  }
  return <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{String(value ?? "") || "—"}</p>;
}

export default function RefreshFromVault({ entityType, entityKey, pagePath, blockedReason }: Props) {
  const [phase, setPhase] = useState<"idle" | "loading" | "review" | "publishing">("idle");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [versions, setVersions] = useState<Version[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Public links edited in the review screen (saved straight to the vault document).
  const [urls, setUrls] = useState<Record<string, string | null>>({});
  const [urlDraft, setUrlDraft] = useState<Record<string, string>>({});
  const [urlBusy, setUrlBusy] = useState<string | null>(null);
  const [urlMsg, setUrlMsg] = useState<Record<string, { ok: boolean; text: string }>>({});

  const fields = FIELDS[entityType];
  const live = versions[0];
  const blocked = Boolean(blockedReason);

  // Version history (published versions are listed newest first).
  useEffect(() => {
    let cancelled = false;
    adminFetch(`/api/admin/page-refresh/versions?entity_type=${entityType}&entity_key=${encodeURIComponent(entityKey)}`)
      .then(async (res) => ({ ok: res.ok, data: await res.json().catch(() => ({})) }))
      .then(({ ok, data }) => {
        if (!cancelled && ok) setVersions(data.versions ?? []);
      })
      .catch(() => {
        /* history is optional */
      });
    return () => {
      cancelled = true;
    };
  }, [entityType, entityKey]);

  async function post(url: string, body: unknown, timeout?: number) {
    const res = await adminFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      timeout,
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error ?? "Request failed");
    return d;
  }

  async function startRefresh() {
    setPhase("loading");
    setError("");
    setMessage("");
    try {
      const d: Preview = await post(
        "/api/admin/page-refresh/preview",
        { entity_type: entityType, entity_key: entityKey },
        PREVIEW_TIMEOUT_MS, // searching the vault and writing with the AI can take a minute or more
      );
      setPreview(d);
      setAccepted(Object.fromEntries(d.changed.map((f) => [f, true])));
      setSelected(new Set(d.sources.filter((s) => s.cited).map((s) => s.id)));
      setNote("");
      setUrls({});
      setUrlDraft({});
      setUrlMsg({});
      setPhase("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refresh failed");
      setPhase("idle");
    }
  }

  function reloadSoon(text: string) {
    setMessage(`${text} Reloading…`);
    setTimeout(() => window.location.reload(), 1200);
  }

  async function publish() {
    if (!preview) return;
    const chosen = fields.filter((f) => accepted[f]);
    if (chosen.length === 0) return;
    if (!window.confirm(`Publish ${chosen.length} field${chosen.length > 1 ? "s" : ""} to the live site? You can revert afterwards from the version history.`)) return;

    setPhase("publishing");
    setError("");
    try {
      await post("/api/admin/page-refresh/publish", {
        entity_type: entityType,
        entity_key: entityKey,
        content: Object.fromEntries(chosen.map((f) => [f, preview.proposed[f]])),
        source_ids: preview.sources.filter((s) => selected.has(s.id)).map((s) => s.id),
        note: note || null,
      });
      reloadSoon("Published.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
      setPhase("review");
    }
  }

  async function revert(v: Version) {
    if (!window.confirm(`Restore version ${v.version} on the live site? This publishes it as a new version.`)) return;
    setBusyId(v.id);
    setError("");
    try {
      await post("/api/admin/page-refresh/revert", { version_id: v.id });
      reloadSoon(`Restored version ${v.version}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revert failed");
      setBusyId(null);
    }
  }

  /** Link shown for a source: the one just saved here, else what the vault had. */
  const linkOf = (id: string, original: string | null) => (id in urls ? urls[id] : original);

  async function saveUrl(id: string, original: string | null) {
    const value = (urlDraft[id] ?? linkOf(id, original) ?? "").trim();
    let valid = value === "";
    if (!valid) {
      try {
        valid = /^https?:\/\//i.test(value) && Boolean(new URL(value));
      } catch {
        valid = false;
      }
    }
    if (!valid) {
      setUrlMsg((m) => ({ ...m, [id]: { ok: false, text: "Enter a full web address starting with https://" } }));
      return;
    }
    setUrlBusy(id);
    try {
      const res = await adminFetch(`/api/admin/vault/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_url: value }),
      });
      if (!res.ok) throw new Error("Could not save the link");
      setUrls((u) => ({ ...u, [id]: value || null }));
      setUrlDraft((d) => {
        const next = { ...d };
        delete next[id];
        return next;
      });
      setUrlMsg((m) => ({
        ...m,
        [id]: { ok: true, text: value ? "Saved to the vault. Every page using this document now links to it." : "Link removed from the vault." },
      }));
    } catch (e) {
      setUrlMsg((m) => ({ ...m, [id]: { ok: false, text: e instanceof Error ? e.message : "Could not save the link" } }));
    } finally {
      setUrlBusy(null);
    }
  }

  const missingLinks = preview
    ? preview.sources.filter((src) => selected.has(src.id) && !linkOf(src.id, src.url)).length
    : 0;

  const acceptedCount = fields.filter((f) => accepted[f]).length;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Header */}
      <div style={{ ...box, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Refresh from vault</div>
          <div style={{ fontSize: 12, ...muted, marginTop: 2 }}>
            Finds the latest relevant documents in the vault, proposes updated content, and lets you review before it goes live.
            {live && <> Live: version {live.version} ({when(live.created_at)}).</>}
          </div>
          {blockedReason && <div style={{ fontSize: 12, color: "var(--admin-warning, #b45309)", marginTop: 6 }}>{blockedReason}</div>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href={pagePath} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-secondary text-xs">View on site</a>
          <button className="admin-btn admin-btn-primary" onClick={startRefresh} disabled={blocked || phase === "loading" || phase === "publishing"}>
            {phase === "loading" ? "Searching vault…" : "Refresh from vault"}
          </button>
        </div>
      </div>

      {error && <div role="alert" style={{ ...box, borderColor: "#fecaca", color: "#b91c1c", fontSize: 13 }}>{error}</div>}
      {message && <div role="status" style={{ ...box, borderColor: "#bbf7d0", color: "#15803d", fontSize: 13 }}>{message}</div>}

      {/* Review */}
      {preview && (phase === "review" || phase === "publishing") && (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Review changes — {preview.subject}</div>

          {preview.warnings.map((w) => (
            <div key={w} style={{ ...box, borderColor: "#fde68a", background: "#fffbeb", color: "#92400e", fontSize: 13 }}>{w}</div>
          ))}

          {fields.map((f) => {
            const changed = preview.changed.includes(f);
            return (
              <div key={f} style={box}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontWeight: 600, fontSize: 13, opacity: changed ? 1 : 0.6 }}>
                  <input
                    type="checkbox"
                    style={checkbox}
                    checked={Boolean(accepted[f])}
                    disabled={!changed || phase === "publishing"}
                    onChange={(e) => setAccepted((a) => ({ ...a, [f]: e.target.checked }))}
                  />
                  {FIELD_LABELS[f] ?? f}
                  <span style={{ fontWeight: 400, fontSize: 12, ...muted }}>{changed ? "Changed" : "No change"}</span>
                </label>
                <div style={{ display: "grid", gridTemplateColumns: changed ? "1fr 1fr" : "1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", ...muted, marginBottom: 4 }}>Current</div>
                    <Value value={preview.current[f]} />
                  </div>
                  {changed && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#15803d", marginBottom: 4 }}>Proposed</div>
                      <Value value={preview.proposed[f]} />
                    </div>
                  )}
                </div>

                {changed && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed var(--admin-border)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", ...muted, marginBottom: 6 }}>
                      Where this comes from
                    </div>
                    {(preview.evidence[f] ?? []).length === 0 ? (
                      <div style={{ fontSize: 12, color: "#b91c1c" }}>
                        No supporting quote was given. Check this change against the source documents before publishing.
                      </div>
                    ) : (
                      (preview.evidence[f] ?? []).map((ev, i) => {
                        const link = linkOf(ev.sourceId, ev.url);
                        return (
                          <div key={i} style={{ marginBottom: 8, fontSize: 12 }}>
                            <div style={{ fontWeight: 600 }}>
                              {link ? (
                                <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: "var(--admin-accent)" }}>{ev.label} ↗</a>
                              ) : (
                                ev.label
                              )}
                              {(ev.page || ev.heading) && (
                                <span style={{ fontWeight: 400, ...muted }}>
                                  {" "}· {[ev.page ? `p. ${ev.page}` : "", ev.heading ?? ""].filter(Boolean).join(" · ")}
                                </span>
                              )}
                            </div>
                            <blockquote style={{ margin: "4px 0", padding: "4px 10px", borderLeft: `3px solid ${ev.verified ? "#86efac" : "#fca5a5"}`, fontStyle: "italic", lineHeight: 1.5 }}>
                              “{ev.quote}”
                            </blockquote>
                            <span style={{ color: ev.verified ? "#15803d" : "#b91c1c" }}>
                              {ev.verified ? "✓ Quote found in the document" : "⚠ Quote not found in the document — check by hand"}
                            </span>
                          </div>
                        );
                      })
                    )}
                    {(preview.unsupported[f] ?? []).length > 0 && (
                      <div style={{ fontSize: 12, color: "#b45309", marginTop: 4 }}>
                        ⚠ Figures not found in the document excerpts: <strong>{preview.unsupported[f].join(", ")}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div style={box}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Sources shown at the bottom of the page</div>
            <div style={{ fontSize: 12, ...muted, marginBottom: 10 }}>
              Tick the documents to list. Add or fix a public link here and it is saved to the vault document.
            </div>
            {missingLinks > 0 && (
              <div style={{ fontSize: 12, color: "#b45309", marginBottom: 10 }}>
                {missingLinks} selected document{missingLinks > 1 ? "s have" : " has"} no public link and will show as plain text. Paste the link below to make {missingLinks > 1 ? "them" : "it"} clickable.
              </div>
            )}
            {preview.sources.map((s) => {
              const link = linkOf(s.id, s.url);
              const msg = urlMsg[s.id];
              return (
                <div key={s.id} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid var(--admin-border)" }}>
                  <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13 }}>
                    <input
                      type="checkbox"
                      style={{ ...checkbox, marginTop: 3 }}
                      checked={selected.has(s.id)}
                      disabled={phase === "publishing"}
                      onChange={(e) =>
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(s.id);
                          else next.delete(s.id);
                          return next;
                        })
                      }
                    />
                    <span>
                      {s.label}{" "}
                      {s.cited ? <em style={{ fontSize: 11, color: "#1d4ed8" }}>cited</em> : <em style={{ fontSize: 11, ...muted }}>considered, not cited</em>}
                    </span>
                  </label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6, marginLeft: 24, flexWrap: "wrap" }}>
                    <input
                      type="url"
                      value={urlDraft[s.id] ?? link ?? ""}
                      onChange={(e) => setUrlDraft((d) => ({ ...d, [s.id]: e.target.value }))}
                      placeholder="https://… public link to this document"
                      aria-label={`Public link for ${s.label}`}
                      className="swa-form-input"
                      style={{ flex: "1 1 280px", fontSize: 12 }}
                      disabled={phase === "publishing" || urlBusy === s.id}
                    />
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary text-xs"
                      onClick={() => saveUrl(s.id, s.url)}
                      disabled={phase === "publishing" || urlBusy === s.id || (urlDraft[s.id] === undefined)}
                    >
                      {urlBusy === s.id ? "Saving…" : "Save link"}
                    </button>
                    {link && (
                      <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--admin-accent)" }}>Test link ↗</a>
                    )}
                  </div>
                  <div style={{ marginLeft: 24, marginTop: 4, fontSize: 12 }}>
                    {msg ? (
                      <span style={{ color: msg.ok ? "#15803d" : "#b91c1c" }}>{msg.text}</span>
                    ) : link ? (
                      <span style={{ color: "#15803d" }}>Public link set</span>
                    ) : (
                      <span style={{ color: "#b45309" }}>No public link: will show as plain text</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            placeholder="Optional note for the version history (e.g. “Updated with AIHW 2026”)"
            className="swa-form-input"
            style={{ width: "100%" }}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <button className="admin-btn admin-btn-primary" onClick={publish} disabled={acceptedCount === 0 || phase === "publishing"}>
              {phase === "publishing" ? "Publishing…" : `Publish ${acceptedCount} selected field${acceptedCount === 1 ? "" : "s"}`}
            </button>
            <button className="admin-btn admin-btn-ghost" onClick={() => { setPreview(null); setPhase("idle"); }} disabled={phase === "publishing"}>
              Discard
            </button>
          </div>
        </div>
      )}

      {/* History */}
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Version history</div>
        {versions.length === 0 ? (
          <div style={{ fontSize: 13, ...muted }}>No vault refreshes published for this page yet. The current content is saved as the original the first time you publish.</div>
        ) : (
          versions.map((v, i) => (
            <div key={v.id} style={box}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ fontSize: 13 }}>
                  <strong>Version {v.version}</strong> · {ORIGIN_LABEL[v.origin]}
                  {i === 0 && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: "#15803d" }}>LIVE</span>}
                  <div style={{ fontSize: 12, ...muted }}>
                    {when(v.created_at)}{v.created_by_email ? ` · ${v.created_by_email}` : ""} · {v.source_count} source{v.source_count === 1 ? "" : "s"}
                    {v.note ? ` · ${v.note}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="admin-btn admin-btn-ghost text-xs" onClick={() => setOpen(open === v.id ? null : v.id)}>
                    {open === v.id ? "Hide" : "View"}
                  </button>
                  {i !== 0 && (
                    <button className="admin-btn admin-btn-secondary text-xs" onClick={() => revert(v)} disabled={blocked || busyId !== null}>
                      {busyId === v.id ? "Restoring…" : "Revert to this version"}
                    </button>
                  )}
                </div>
              </div>
              {open === v.id && (
                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  {fields.map((f) => (
                    <div key={f}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", ...muted, marginBottom: 4 }}>{FIELD_LABELS[f] ?? f}</div>
                      <Value value={v.content[f]} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
