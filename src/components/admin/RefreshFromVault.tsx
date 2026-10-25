"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminFetch";
import { FIELDS, FIELD_LABELS, type EntityType } from "@/lib/pageRefresh/entities";
import { changedFields } from "@/lib/pageRefresh/prompt";
import AddSourcesPanel, { type FoundSource } from "@/components/admin/AddSourcesPanel";
import DraftFieldEditor from "@/components/admin/DraftFieldEditor";

interface PreviewSource {
  id: string;
  title: string;
  label: string;
  url: string | null;
  year: string | null;
  cited: boolean;
  /** added by the reviewer through "Add more sources" */
  added?: boolean;
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

/** What the review screen shows as proof: from the AI draft, or from the latest "Re-run verification". */
interface Verification {
  evidence: Record<string, EvidenceItem[]>;
  unsupported: Record<string, string[]>;
  warnings: string[];
}

/** Identifies the exact text and ticked sources a verification applies to. */
function stateKey(proposed: Record<string, unknown>, selectedIds: string[]): string {
  return JSON.stringify({ p: proposed, s: [...selectedIds].sort() });
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

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
  // Reviewer edits to the AI draft, extra sources, and the latest verification.
  const [edits, setEdits] = useState<Record<string, unknown>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [extraSources, setExtraSources] = useState<PreviewSource[]>([]);
  const [view, setView] = useState<Verification>({ evidence: {}, unsupported: {}, warnings: [] });
  const [verifiedKey, setVerifiedKey] = useState("");
  const [verifying, setVerifying] = useState(false);

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
      const initialSelected = d.sources.filter((s) => s.cited).map((s) => s.id);
      setPreview(d);
      setAccepted({});
      setSelected(new Set(initialSelected));
      setEdits({});
      setEditing({});
      setExtraSources([]);
      setView({ evidence: d.evidence, unsupported: d.unsupported, warnings: d.warnings });
      setVerifiedKey(stateKey(Object.fromEntries(fields.map((f) => [f, d.proposed[f]])), initialSelected));
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
    const chosen = changedNow.filter(isAccepted);
    if (chosen.length === 0) return;
    const warning = stale
      ? "The checks on this screen are out of date: you edited the text or changed the ticked sources since the last verification.\n\n"
      : "";
    if (!window.confirm(`${warning}Publish ${chosen.length} field${chosen.length > 1 ? "s" : ""} to the live site? You can revert afterwards from the version history.`)) return;

    setPhase("publishing");
    setError("");
    try {
      await post("/api/admin/page-refresh/publish", {
        entity_type: entityType,
        entity_key: entityKey,
        content: Object.fromEntries(chosen.map((f) => [f, proposedNow[f]])),
        source_ids: selectedIds,
        note: note || null,
      });
      reloadSoon("Published.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
      setPhase("review");
    }
  }

  /** Re-check the (possibly edited) draft against every ticked source, original and added. */
  async function verify() {
    if (!preview || selectedIds.length === 0) return;
    const key = currentKey;
    setVerifying(true);
    setError("");
    try {
      const d = await post(
        "/api/admin/page-refresh/verify",
        { entity_type: entityType, entity_key: entityKey, proposed: proposedNow, source_ids: selectedIds },
        PREVIEW_TIMEOUT_MS,
      );
      setView({ evidence: d.evidence ?? {}, unsupported: d.unsupported ?? {}, warnings: d.warnings ?? [] });
      setVerifiedKey(key);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  function startEdit(f: string) {
    setEdits((e) => (f in e ? e : { ...e, [f]: clone(effective(f)) }));
    setEditing((e) => ({ ...e, [f]: true }));
  }

  function resetEdit(f: string) {
    setEdits((e) => {
      const next = { ...e };
      delete next[f];
      return next;
    });
    setEditing((e) => ({ ...e, [f]: false }));
  }

  function addSource(src: FoundSource) {
    const { snippets: _snippets, ...rest } = src;
    void _snippets;
    setExtraSources((prev) => (prev.some((p) => p.id === src.id) ? prev : [...prev, { ...rest, added: true }]));
    setSelected((prev) => new Set(prev).add(src.id));
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

  const allSources = preview ? [...preview.sources, ...extraSources] : [];
  const selectedIds = allSources.filter((src) => selected.has(src.id)).map((src) => src.id);
  const missingLinks = allSources.filter((src) => selected.has(src.id) && !linkOf(src.id, src.url)).length;

  // The draft as it would be published: AI proposal with the reviewer's edits on top.
  const effective = (f: string): unknown => (f in edits ? edits[f] : preview?.proposed[f]);
  const proposedNow: Record<string, unknown> = Object.fromEntries(fields.map((f) => [f, effective(f)]));
  const changedNow = preview ? changedFields(entityType, preview.current, proposedNow) : [];
  const isAccepted = (f: string) => accepted[f] !== false;
  const acceptedCount = changedNow.filter(isAccepted).length;

  const currentKey = stateKey(proposedNow, selectedIds);
  const stale = Boolean(preview) && currentKey !== verifiedKey;
  const quotedIds = new Set(
    Object.values(view.evidence).flatMap((items) => items.filter((i) => i.verified).map((i) => i.sourceId)),
  );
  const busy = phase === "publishing" || verifying;

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

          {view.warnings.map((w) => (
            <div key={w} style={{ ...box, borderColor: "#fde68a", background: "#fffbeb", color: "#92400e", fontSize: 13 }}>{w}</div>
          ))}

          {/* Verification status: re-run after editing the text or changing the ticked sources */}
          <div
            style={{
              ...box,
              borderColor: stale ? "#fde68a" : "#bbf7d0",
              background: stale ? "#fffbeb" : "#f0fdf4",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 13 }}>
              {stale ? (
                <><strong>Verification is out of date.</strong> You edited the text or changed the ticked sources.</>
              ) : (
                <><strong>Verification is up to date</strong> for the text and sources below.</>
              )}
              <div style={{ fontSize: 12, ...muted }}>
                Re-running finds supporting quotes for the current wording and checks every quote and figure against the {selectedIds.length} ticked source{selectedIds.length === 1 ? "" : "s"}.
              </div>
            </div>
            <button
              className={stale ? "admin-btn admin-btn-primary" : "admin-btn admin-btn-secondary"}
              onClick={verify}
              disabled={busy || selectedIds.length === 0 || changedNow.length === 0}
            >
              {verifying ? "Verifying…" : "Re-run verification"}
            </button>
          </div>

          {fields.map((f) => {
            const changed = changedNow.includes(f);
            const isEditing = Boolean(editing[f]);
            const edited = f in edits && JSON.stringify(edits[f]) !== JSON.stringify(preview.proposed[f]);
            const hasEvidenceKey = f in view.evidence;
            const outdated = stale && (edited || !hasEvidenceKey);
            return (
              <div key={f} style={box}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontWeight: 600, fontSize: 13, opacity: changed ? 1 : 0.6 }}>
                  <input
                    type="checkbox"
                    style={checkbox}
                    checked={changed && isAccepted(f)}
                    disabled={!changed || busy}
                    onChange={(e) => setAccepted((a) => ({ ...a, [f]: e.target.checked }))}
                  />
                  {FIELD_LABELS[f] ?? f}
                  <span style={{ fontWeight: 400, fontSize: 12, ...muted }}>
                    {changed ? (edited ? "Changed (edited by you)" : "Changed") : "No change"}
                  </span>
                </label>
                <div style={{ display: "grid", gridTemplateColumns: changed || isEditing ? "1fr 1fr" : "1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", ...muted, marginBottom: 4 }}>Current</div>
                    <Value value={preview.current[f]} />
                    {!changed && !isEditing && (
                      <button type="button" className="admin-btn admin-btn-ghost text-xs" style={{ marginTop: 8 }} onClick={() => startEdit(f)} disabled={busy}>
                        Edit this field
                      </button>
                    )}
                  </div>
                  {(changed || isEditing) && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#15803d" }}>
                          {edited ? "Proposed (your edit)" : "Proposed"}
                        </span>
                        <span style={{ display: "flex", gap: 6 }}>
                          {isEditing ? (
                            <button type="button" className="admin-btn admin-btn-secondary text-xs" onClick={() => setEditing((e) => ({ ...e, [f]: false }))}>
                              Done editing
                            </button>
                          ) : (
                            <button type="button" className="admin-btn admin-btn-ghost text-xs" onClick={() => startEdit(f)} disabled={busy}>
                              Edit
                            </button>
                          )}
                          {f in edits && (
                            <button type="button" className="admin-btn admin-btn-ghost text-xs" onClick={() => resetEdit(f)} disabled={busy}>
                              Reset to AI draft
                            </button>
                          )}
                        </span>
                      </div>
                      {isEditing ? (
                        <DraftFieldEditor field={f} value={effective(f)} disabled={busy} onChange={(v) => setEdits((e) => ({ ...e, [f]: v }))} />
                      ) : (
                        <Value value={effective(f)} />
                      )}
                    </div>
                  )}
                </div>

                {changed && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed var(--admin-border)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", ...muted, marginBottom: 6 }}>
                      Where this comes from
                    </div>
                    {outdated && (
                      <div style={{ fontSize: 12, color: "#b45309", marginBottom: 6 }}>
                        {hasEvidenceKey
                          ? "You edited this text or changed the sources since it was checked. The quotes below may no longer match: re-run verification."
                          : "Not verified yet. Re-run verification to find supporting quotes for this text."}
                      </div>
                    )}
                    {!outdated && (view.evidence[f] ?? []).length === 0 && (
                      <div style={{ fontSize: 12, color: "#b91c1c" }}>
                        No supporting quote was found in the ticked sources. Check this change against the source documents, or tick more sources and re-run verification.
                      </div>
                    )}
                    {hasEvidenceKey &&
                      (view.evidence[f] ?? []).map((ev, i) => {
                        const link = linkOf(ev.sourceId, ev.url);
                        return (
                          <div key={i} style={{ marginBottom: 8, fontSize: 12, opacity: outdated ? 0.6 : 1 }}>
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
                      })}
                    {(view.unsupported[f] ?? []).length > 0 && (
                      <div style={{ fontSize: 12, color: "#b45309", marginTop: 4, opacity: outdated ? 0.6 : 1 }}>
                        ⚠ Figures not found in the ticked documents: <strong>{view.unsupported[f].join(", ")}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <div style={box}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Sources</div>
            <div style={{ fontSize: 12, ...muted, marginBottom: 10 }}>
              Ticked documents are used to verify the text above and are listed at the bottom of the page. Add or fix a public link here and it is saved to the vault document.
            </div>
            {missingLinks > 0 && (
              <div style={{ fontSize: 12, color: "#b45309", marginBottom: 10 }}>
                {missingLinks} selected document{missingLinks > 1 ? "s have" : " has"} no public link and will show as plain text. Paste the link below to make {missingLinks > 1 ? "them" : "it"} clickable.
              </div>
            )}
            {allSources.map((s) => {
              const link = linkOf(s.id, s.url);
              const msg = urlMsg[s.id];
              return (
                <div key={s.id} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid var(--admin-border)" }}>
                  <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13 }}>
                    <input
                      type="checkbox"
                      style={{ ...checkbox, marginTop: 3 }}
                      checked={selected.has(s.id)}
                      disabled={busy}
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
                      {quotedIds.has(s.id) ? (
                        <em style={{ fontSize: 11, color: "#15803d" }}>quoted as evidence</em>
                      ) : s.added ? (
                        <em style={{ fontSize: 11, color: "#1d4ed8" }}>added by you</em>
                      ) : s.cited ? (
                        <em style={{ fontSize: 11, color: "#1d4ed8" }}>cited</em>
                      ) : (
                        <em style={{ fontSize: 11, ...muted }}>considered, not cited</em>
                      )}
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
                      disabled={busy || urlBusy === s.id}
                    />
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary text-xs"
                      onClick={() => saveUrl(s.id, s.url)}
                      disabled={busy || urlBusy === s.id || (urlDraft[s.id] === undefined)}
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

            <AddSourcesPanel existingIds={new Set(allSources.map((x) => x.id))} onAdd={addSource} disabled={busy} />
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
            <button className="admin-btn admin-btn-primary" onClick={publish} disabled={acceptedCount === 0 || busy}>
              {phase === "publishing" ? "Publishing…" : `Publish ${acceptedCount} selected field${acceptedCount === 1 ? "" : "s"}`}
            </button>
            <button className="admin-btn admin-btn-ghost" onClick={() => { setPreview(null); setPhase("idle"); }} disabled={busy}>
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
