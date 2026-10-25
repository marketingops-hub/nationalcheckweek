"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminFetch";
import { FIELDS, FIELD_LABELS, type EntityType } from "@/lib/pageRefresh/entities";
import { changedFields } from "@/lib/pageRefresh/prompt";
import AddSourcesPanel, { type FoundSource } from "@/components/admin/AddSourcesPanel";
import DraftFieldEditor from "@/components/admin/DraftFieldEditor";

/* ─── Types ─────────────────────────────────────────────────────────────── */

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

/** The proof shown on screen: from the AI draft, or from the latest check. */
interface Verification {
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

/* ─── Small helpers ─────────────────────────────────────────────────────── */

/** The admin theme stretches bare inputs to full width; keep checkboxes small. */
const checkbox = { width: 16, height: 16, flex: "none", margin: 0, padding: 0 } as const;

/** The draft is an AI call; the default 30s browser timeout is far too short. */
const AI_TIMEOUT_MS = 150_000;

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
const label11 = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" } as const;
const linkButton = {
  border: 0, background: "none", padding: 0, width: "auto", color: "var(--admin-accent)",
  cursor: "pointer", fontSize: 12, textDecoration: "underline",
} as const;

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function when(iso: string) {
  return new Date(iso).toLocaleString("en-AU", { timeZone: "Australia/Sydney", dateStyle: "medium", timeStyle: "short" });
}

/** Identifies the exact text and ticked sources a check applies to. */
function stateKey(proposed: Record<string, unknown>, selectedIds: string[]): string {
  return JSON.stringify({ p: proposed, s: [...selectedIds].sort() });
}

function Value({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    return (
      <div style={{ fontSize: 13, lineHeight: 1.6 }}>
        {value.map((v, i) => {
          // "Groups most at risk": a list of short phrases
          if (typeof v === "string") return <div key={i}>• {v}</div>;
          const s = v as { num?: string; label?: string; name?: string; stat?: string; desc?: string; title?: string; text?: string };
          // "Key impact areas": a title with a one-sentence description
          if (s.title !== undefined && s.text !== undefined) {
            return (
              <div key={i} style={{ marginBottom: 6 }}>
                <strong>{s.title}</strong>
                <div>{s.text}</div>
              </div>
            );
          }
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

/** How well a change is backed by the sources. */
type Health = "ok" | "check" | "none" | "unchecked";

function healthOf(items: EvidenceItem[] | undefined, unsupported: string[] | undefined, outdated: boolean): Health {
  if (outdated) return "unchecked";
  const list = items ?? [];
  if (list.length === 0) return "none";
  if (list.some((i) => !i.verified) || (unsupported?.length ?? 0) > 0) return "check";
  return "ok";
}

const HEALTH: Record<Health, { text: string; color: string; bg: string }> = {
  ok: { text: "✓ Backed by sources", color: "#15803d", bg: "#f0fdf4" },
  check: { text: "⚠ Check by hand", color: "#b45309", bg: "#fffbeb" },
  none: { text: "No supporting quote", color: "#b91c1c", bg: "#fef2f2" },
  unchecked: { text: "Not checked yet", color: "#6b7280", bg: "#f3f4f6" },
};

function Chip({ health }: { health: Health }) {
  const h = HEALTH[health];
  return (
    <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700, color: h.color, background: h.bg }}>{h.text}</span>
  );
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function RefreshFromVault({ entityType, entityKey, pagePath, blockedReason }: Props) {
  const [phase, setPhase] = useState<"idle" | "loading" | "review" | "publishing">("idle");
  const [tab, setTab] = useState<"changes" | "sources">("changes");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [versions, setVersions] = useState<Version[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Reviewer edits, extra sources and the latest check.
  const [edits, setEdits] = useState<Record<string, unknown>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [extraSources, setExtraSources] = useState<PreviewSource[]>([]);
  const [view, setView] = useState<Verification>({ evidence: {}, unsupported: {}, warnings: [] });
  const [verifiedKey, setVerifiedKey] = useState("");
  const [draftSources, setDraftSources] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Public links (saved straight to the vault document).
  const [urls, setUrls] = useState<Record<string, string | null>>({});
  const [linkEditing, setLinkEditing] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [urlBusy, setUrlBusy] = useState<string | null>(null);
  const [urlMsg, setUrlMsg] = useState<Record<string, { ok: boolean; text: string }>>({});

  const fields = FIELDS[entityType];
  const live = versions[0];
  const blocked = Boolean(blockedReason);

  // Version history (newest first).
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

  /* ── Derived state ── */

  const allSources = preview ? [...preview.sources, ...extraSources] : [];
  const selectedIds = allSources.filter((s) => selected.has(s.id)).map((s) => s.id);
  const linkOf = (id: string, original: string | null) => (id in urls ? urls[id] : original);

  // The draft as it would be published: the AI draft with the reviewer's edits on top.
  const effective = (f: string): unknown => (f in edits ? edits[f] : preview?.proposed[f]);
  const proposedNow: Record<string, unknown> = Object.fromEntries(fields.map((f) => [f, effective(f)]));
  const changedNow = preview ? changedFields(entityType, preview.current, proposedNow) : [];
  const isIncluded = (f: string) => accepted[f] !== false;
  const includedNow = changedNow.filter(isIncluded);

  const sourcesChanged = Boolean(preview) && [...selectedIds].sort().join(",") !== draftSources;
  const textStale = Boolean(preview) && stateKey(proposedNow, selectedIds) !== verifiedKey;
  const busy = phase === "publishing" || verifying || regenerating;

  const quotedIds = new Set(
    Object.values(view.evidence).flatMap((items) => items.filter((i) => i.verified).map((i) => i.sourceId)),
  );
  const missingLinks = allSources.filter((s) => selected.has(s.id) && !linkOf(s.id, s.url)).length;

  const isOutdated = (f: string) => {
    const edited = f in edits && JSON.stringify(edits[f]) !== JSON.stringify(preview?.proposed[f]);
    return textStale && (edited || !(f in view.evidence) || sourcesChanged);
  };
  const healthFor = (f: string): Health => healthOf(view.evidence[f], view.unsupported[f], isOutdated(f));
  const healthCounts = includedNow.reduce(
    (acc, f) => {
      acc[healthFor(f)]++;
      return acc;
    },
    { ok: 0, check: 0, none: 0, unchecked: 0 } as Record<Health, number>,
  );

  /* ── Actions ── */

  /** Load a draft (new refresh or regeneration) into the review screen. */
  function applyPreview(d: Preview, ticked: string[], keepOut: PreviewSource[] = []) {
    setPreview(d);
    setAccepted({});
    setSelected(new Set(ticked));
    setEdits({});
    setEditing({});
    // Sources the reviewer had unticked stay listed (unticked) so they can be added back.
    setExtraSources(keepOut.filter((k) => !d.sources.some((x) => x.id === k.id)));
    setView({ evidence: d.evidence, unsupported: d.unsupported, warnings: d.warnings });
    setVerifiedKey(stateKey(Object.fromEntries(fields.map((f) => [f, d.proposed[f]])), ticked));
    setDraftSources([...ticked].sort().join(","));
    setNote("");
    setUrls({});
    setLinkEditing(null);
    setUrlMsg({});
    setTab("changes");
    setPhase("review");
  }

  async function startRefresh() {
    setPhase("loading");
    setError("");
    setMessage("");
    try {
      const d: Preview = await post(
        "/api/admin/page-refresh/preview",
        { entity_type: entityType, entity_key: entityKey },
        AI_TIMEOUT_MS,
      );
      applyPreview(d, d.sources.filter((s) => s.cited).map((s) => s.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refresh failed");
      setPhase("idle");
    }
  }

  /** Write a new draft from the ticked sources only (original and added). */
  async function regenerate() {
    if (!preview || selectedIds.length === 0) return;
    if (
      Object.keys(edits).length > 0 &&
      !window.confirm("This writes a new draft from the ticked sources and replaces the edits you have made. Continue?")
    ) {
      return;
    }
    setRegenerating(true);
    setError("");
    try {
      const d: Preview = await post(
        "/api/admin/page-refresh/preview",
        { entity_type: entityType, entity_key: entityKey, source_ids: selectedIds },
        AI_TIMEOUT_MS,
      );
      applyPreview(d, selectedIds, allSources);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Regeneration failed");
    } finally {
      setRegenerating(false);
    }
  }

  /** Keep the wording and re-check it against every ticked source. */
  async function recheck() {
    if (!preview || selectedIds.length === 0) return;
    const key = stateKey(proposedNow, selectedIds);
    setVerifying(true);
    setError("");
    try {
      const d = await post(
        "/api/admin/page-refresh/verify",
        { entity_type: entityType, entity_key: entityKey, proposed: proposedNow, source_ids: selectedIds },
        AI_TIMEOUT_MS,
      );
      setView({ evidence: d.evidence ?? {}, unsupported: d.unsupported ?? {}, warnings: d.warnings ?? [] });
      setVerifiedKey(key);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check failed");
    } finally {
      setVerifying(false);
    }
  }

  function reloadSoon(text: string) {
    setMessage(`${text} Reloading…`);
    setTimeout(() => window.location.reload(), 1200);
  }

  async function publish() {
    if (!preview || includedNow.length === 0) return;
    const caution = textStale
      ? "The evidence shown is out of date because you changed the text or the sources since the last check.\n\n"
      : "";
    const n = includedNow.length;
    if (!window.confirm(`${caution}Publish ${n} change${n > 1 ? "s" : ""} to the live site? You can undo it afterwards from the version history.`)) return;

    setPhase("publishing");
    setError("");
    try {
      await post("/api/admin/page-refresh/publish", {
        entity_type: entityType,
        entity_key: entityKey,
        content: Object.fromEntries(includedNow.map((f) => [f, proposedNow[f]])),
        source_ids: selectedIds,
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

  async function saveLink(id: string) {
    const value = urlDraft.trim();
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
      setLinkEditing(null);
      setUrlMsg((m) => ({ ...m, [id]: { ok: true, text: value ? "Saved to the vault." : "Link removed." } }));
    } catch (e) {
      setUrlMsg((m) => ({ ...m, [id]: { ok: false, text: e instanceof Error ? e.message : "Could not save the link" } }));
    } finally {
      setUrlBusy(null);
    }
  }

  /* ── Pieces of the screen ── */

  /** One message and one button: what to do next. */
  const statusBar = (() => {
    if (!preview) return null;
    const n = selectedIds.length;
    let tone = { border: "#bbf7d0", bg: "#f0fdf4" };
    let text: React.ReactNode;
    let action: React.ReactNode = null;

    if (regenerating || verifying) {
      tone = { border: "#bfdbfe", bg: "#eff6ff" };
      text = <strong>{regenerating ? "Writing a new draft from the ticked sources…" : "Checking your text against the ticked sources…"}</strong>;
    } else if (n === 0) {
      tone = { border: "#fde68a", bg: "#fffbeb" };
      text = <><strong>No sources ticked.</strong> Tick at least one document on the Sources tab.</>;
    } else if (sourcesChanged) {
      tone = { border: "#bfdbfe", bg: "#eff6ff" };
      text = (
        <>
          <strong>You changed the sources.</strong> Regenerate so the draft is written from the {n} ticked source{n === 1 ? "" : "s"}.
          {Object.keys(edits).length > 0 && " This replaces your edits."}
          <div style={{ fontSize: 12, ...muted }}>
            Or{" "}
            <button type="button" onClick={recheck} disabled={busy || changedNow.length === 0} style={linkButton}>
              keep the current text and just re-check it
            </button>
            .
          </div>
        </>
      );
      action = (
        <button className="admin-btn admin-btn-primary" onClick={regenerate} disabled={busy}>
          Regenerate draft
        </button>
      );
    } else if (textStale) {
      tone = { border: "#fde68a", bg: "#fffbeb" };
      text = <><strong>You edited the text.</strong> Re-check it so the evidence matches your wording.</>;
      action = (
        <button className="admin-btn admin-btn-primary" onClick={recheck} disabled={busy || changedNow.length === 0}>
          Re-check my edits
        </button>
      );
    } else {
      text = <><strong>Checked against {n} source{n === 1 ? "" : "s"}.</strong> Each change shows the quote it comes from.</>;
    }

    return (
      <div style={{ ...box, borderColor: tone.border, background: tone.bg, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13 }}>{text}</div>
        {action}
      </div>
    );
  })();

  function evidenceBlock(f: string) {
    const outdated = isOutdated(f);
    const health = healthFor(f);
    const items = view.evidence[f] ?? [];
    const figures = view.unsupported[f] ?? [];
    return (
      <details open style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed var(--admin-border)" }}>
        <summary style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ ...label11, ...muted }}>Where this comes from</span>
          <Chip health={health} />
        </summary>
        <div style={{ marginTop: 8 }}>
          {outdated && (
            <div style={{ fontSize: 12, color: "#b45309", marginBottom: 6 }}>
              {f in view.evidence
                ? "The text or sources changed since this was checked, so the quotes below may no longer match."
                : "Not checked yet for this wording."}
            </div>
          )}
          {!outdated && items.length === 0 && (
            <div style={{ fontSize: 12, color: "#b91c1c" }}>
              None of the ticked sources contain a quote that supports this. Check it against the documents yourself, or add sources and regenerate.
            </div>
          )}
          {items.map((ev, i) => {
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
                    <span style={{ fontWeight: 400, ...muted }}> · {[ev.page ? `p. ${ev.page}` : "", ev.heading ?? ""].filter(Boolean).join(" · ")}</span>
                  )}
                </div>
                <blockquote style={{ margin: "4px 0", padding: "4px 10px", borderLeft: `3px solid ${ev.verified ? "#86efac" : "#fca5a5"}`, fontStyle: "italic", lineHeight: 1.5 }}>
                  “{ev.quote}”
                </blockquote>
                <span style={{ color: ev.verified ? "#15803d" : "#b91c1c" }}>
                  {ev.verified ? "✓ Found in the document" : "⚠ Not found in the document: check by hand"}
                </span>
              </div>
            );
          })}
          {figures.length > 0 && (
            <div style={{ fontSize: 12, color: "#b45309", opacity: outdated ? 0.6 : 1 }}>
              ⚠ These figures are not in the ticked documents: <strong>{figures.join(", ")}</strong>
            </div>
          )}
        </div>
      </details>
    );
  }

  function fieldCard(f: string) {
    if (!preview) return null;
    const changed = changedNow.includes(f);
    const isEditing = Boolean(editing[f]);
    const edited = f in edits && JSON.stringify(edits[f]) !== JSON.stringify(preview.proposed[f]);

    // Fields with no change collapse to one line.
    if (!changed && !isEditing) {
      return (
        <div key={f} style={{ ...box, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 14px" }}>
          <span style={{ fontSize: 13 }}>
            <strong>{FIELD_LABELS[f] ?? f}</strong> <span style={muted}>· no change</span>
          </span>
          <button type="button" className="admin-btn admin-btn-ghost text-xs" onClick={() => startEdit(f)} disabled={busy}>Edit anyway</button>
        </div>
      );
    }

    return (
      <div key={f} style={{ ...box, opacity: isIncluded(f) || !changed ? 1 : 0.7 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14 }}>
            <input
              type="checkbox"
              style={checkbox}
              checked={changed && isIncluded(f)}
              disabled={!changed || busy}
              onChange={(e) => setAccepted((a) => ({ ...a, [f]: e.target.checked }))}
              aria-label={`Include ${FIELD_LABELS[f] ?? f} when publishing`}
            />
            {FIELD_LABELS[f] ?? f}
            {edited && <span style={{ fontWeight: 400, fontSize: 12, color: "#1d4ed8" }}>edited by you</span>}
          </label>
          <span style={{ display: "flex", gap: 6 }}>
            {isEditing ? (
              <button type="button" className="admin-btn admin-btn-secondary text-xs" onClick={() => setEditing((e) => ({ ...e, [f]: false }))}>Done editing</button>
            ) : (
              <button type="button" className="admin-btn admin-btn-ghost text-xs" onClick={() => startEdit(f)} disabled={busy}>Edit</button>
            )}
            {f in edits && (
              <button type="button" className="admin-btn admin-btn-ghost text-xs" onClick={() => resetEdit(f)} disabled={busy}>Undo my edits</button>
            )}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <div style={{ ...label11, ...muted, marginBottom: 4 }}>Live now</div>
            <Value value={preview.current[f]} />
          </div>
          <div>
            <div style={{ ...label11, color: "#15803d", marginBottom: 4 }}>New version</div>
            {isEditing ? (
              <DraftFieldEditor field={f} value={effective(f)} disabled={busy} onChange={(v) => setEdits((e) => ({ ...e, [f]: v }))} />
            ) : (
              <Value value={effective(f)} />
            )}
          </div>
        </div>

        {changed && evidenceBlock(f)}
      </div>
    );
  }

  const changesTab = preview && (
    <div style={{ display: "grid", gap: 10 }}>
      {view.warnings.map((w) => (
        <div key={w} style={{ ...box, borderColor: "#fde68a", background: "#fffbeb", color: "#92400e", fontSize: 13 }}>{w}</div>
      ))}
      {changedNow.length === 0 && Object.values(editing).every((v) => !v) && (
        <div style={{ ...box, fontSize: 13 }}>
          <strong>Nothing to publish yet.</strong> The vault has nothing newer for this page. You can edit a field yourself, or open the Sources tab to add documents and regenerate.
        </div>
      )}
      {fields.map((f) => fieldCard(f))}
    </div>
  );

  const sourcesTab = preview && (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={box}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Documents for this page</div>
        <div style={{ fontSize: 12, ...muted, marginBottom: 12 }}>
          Ticked documents are used to write and check the text, and are listed at the bottom of the public page.
        </div>
        {missingLinks > 0 && (
          <div style={{ fontSize: 12, color: "#b45309", marginBottom: 10 }}>
            {missingLinks} ticked document{missingLinks > 1 ? "s have" : " has"} no public link and will show as plain text. Use <em>Add link</em> to fix that.
          </div>
        )}
        {allSources.map((s) => {
          const link = linkOf(s.id, s.url);
          const msg = urlMsg[s.id];
          const isLinkEditing = linkEditing === s.id;
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
                    <em style={{ fontSize: 11, color: "#1d4ed8" }}>used by the draft</em>
                  ) : (
                    <em style={{ fontSize: 11, ...muted }}>found, not used</em>
                  )}
                </span>
              </label>

              <div style={{ marginLeft: 24, marginTop: 4, fontSize: 12, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {isLinkEditing ? (
                  <>
                    <input
                      type="url"
                      autoFocus
                      value={urlDraft}
                      onChange={(e) => setUrlDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveLink(s.id);
                        }
                      }}
                      placeholder="https://… public link to this document"
                      aria-label={`Public link for ${s.label}`}
                      className="swa-form-input"
                      style={{ flex: "1 1 280px", fontSize: 12 }}
                      disabled={urlBusy === s.id}
                    />
                    <button type="button" className="admin-btn admin-btn-secondary text-xs" onClick={() => saveLink(s.id)} disabled={urlBusy === s.id}>
                      {urlBusy === s.id ? "Saving…" : "Save to vault"}
                    </button>
                    <button type="button" className="admin-btn admin-btn-ghost text-xs" onClick={() => setLinkEditing(null)} disabled={urlBusy === s.id}>Cancel</button>
                  </>
                ) : (
                  <>
                    {link ? (
                      <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: "#15803d" }}>✓ Public link ↗</a>
                    ) : (
                      <span style={{ color: "#b45309" }}>No public link (shows as plain text)</span>
                    )}
                    <button
                      type="button"
                      className="admin-btn admin-btn-ghost text-xs"
                      onClick={() => {
                        setUrlDraft(link ?? "");
                        setLinkEditing(s.id);
                      }}
                      disabled={busy}
                    >
                      {link ? "Change link" : "Add link"}
                    </button>
                  </>
                )}
                {msg && <span style={{ color: msg.ok ? "#15803d" : "#b91c1c" }}>{msg.text}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div style={box}>
        <AddSourcesPanel existingIds={new Set(allSources.map((x) => x.id))} onAdd={addSource} disabled={busy} />
      </div>

      <div style={{ ...box, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          className={sourcesChanged ? "admin-btn admin-btn-primary" : "admin-btn admin-btn-secondary"}
          onClick={regenerate}
          disabled={busy || selectedIds.length === 0}
        >
          {regenerating ? "Writing…" : `Regenerate draft from ${selectedIds.length} ticked source${selectedIds.length === 1 ? "" : "s"}`}
        </button>
        <span style={{ fontSize: 12, ...muted }}>Writes a new draft using only the ticked documents. Your edits are replaced.</span>
      </div>
    </div>
  );

  const readiness = [
    healthCounts.ok ? `${healthCounts.ok} backed by sources` : "",
    healthCounts.check ? `${healthCounts.check} to check by hand` : "",
    healthCounts.none ? `${healthCounts.none} with no supporting quote` : "",
    healthCounts.unchecked ? `${healthCounts.unchecked} not checked yet` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  /* ── Render ── */

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Start */}
      <div style={{ ...box, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Refresh from vault</div>
          <div style={{ fontSize: 12, ...muted, marginTop: 2 }}>
            Finds the latest relevant documents, writes a new version for you to review, and only changes the live page when you publish.
            {live && <> Live now: version {live.version} ({when(live.created_at)}).</>}
          </div>
          {blockedReason && <div style={{ fontSize: 12, color: "var(--admin-warning, #b45309)", marginTop: 6 }}>{blockedReason}</div>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href={pagePath} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-secondary text-xs">View on site</a>
          {phase === "idle" && (
            <button className="admin-btn admin-btn-primary" onClick={startRefresh} disabled={blocked}>Refresh from vault</button>
          )}
          {phase === "loading" && <button className="admin-btn admin-btn-primary" disabled>Searching vault…</button>}
        </div>
      </div>

      {error && <div role="alert" style={{ ...box, borderColor: "#fecaca", color: "#b91c1c", fontSize: 13 }}>{error}</div>}
      {message && <div role="status" style={{ ...box, borderColor: "#bbf7d0", color: "#15803d", fontSize: 13 }}>{message}</div>}

      {/* Review: status → tabs → publish */}
      {preview && (phase === "review" || phase === "publishing") && (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Review: {preview.subject}</div>
            <button className="admin-btn admin-btn-ghost text-xs" onClick={() => { setPreview(null); setPhase("idle"); }} disabled={busy}>
              Discard this draft
            </button>
          </div>

          {statusBar}

          <div role="tablist" style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--admin-border)" }}>
            {(
              [
                ["changes", `1. Changes${changedNow.length ? ` (${changedNow.length})` : ""}`],
                ["sources", `2. Sources (${selectedIds.length} ticked)`],
              ] as const
            ).map(([id, text]) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                style={{
                  width: "auto", padding: "8px 14px", border: 0, background: "none", cursor: "pointer", fontSize: 13,
                  fontWeight: tab === id ? 700 : 500,
                  borderBottom: `2px solid ${tab === id ? "var(--admin-accent, #3b82f6)" : "transparent"}`,
                  color: tab === id ? "var(--admin-text-primary)" : "var(--admin-text-subtle)",
                }}
              >
                {text}
              </button>
            ))}
          </div>

          {tab === "changes" ? changesTab : sourcesTab}

          {/* 3. Publish */}
          <div style={{ ...box, display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>3. Publish</div>
            <div style={{ fontSize: 13 }}>
              {includedNow.length === 0 ? (
                <span style={muted}>Nothing selected to publish.</span>
              ) : (
                <>
                  <strong>{includedNow.length} change{includedNow.length === 1 ? "" : "s"}</strong> will go live: <span style={muted}>{readiness}.</span>
                </>
              )}
            </div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              placeholder="Optional note for the version history (e.g. “Updated with AIHW 2026”)"
              className="swa-form-input"
              style={{ width: "100%" }}
            />
            <div>
              <button className="admin-btn admin-btn-primary" onClick={publish} disabled={includedNow.length === 0 || busy}>
                {phase === "publishing" ? "Publishing…" : `Publish ${includedNow.length} change${includedNow.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <details>
        <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
          Version history{versions.length ? ` (${versions.length})` : ""}
        </summary>
        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
          {versions.length === 0 ? (
            <div style={{ fontSize: 13, ...muted }}>Nothing published from the vault yet. The current content is saved as the original the first time you publish.</div>
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
                        {busyId === v.id ? "Restoring…" : "Go back to this version"}
                      </button>
                    )}
                  </div>
                </div>
                {open === v.id && (
                  <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                    {fields.map((f) => (
                      <div key={f}>
                        <div style={{ ...label11, ...muted, marginBottom: 4 }}>{FIELD_LABELS[f] ?? f}</div>
                        <Value value={v.content[f]} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </details>
    </div>
  );
}
