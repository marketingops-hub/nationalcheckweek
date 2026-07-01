"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/adminFetch";
import { asJson } from "@/lib/content-creator/http";
import { reviewState, REVIEW_STATE_LABEL, type ContentDraft, type ReviewState } from "@/lib/content-creator/types";

const STATE_STYLE: Record<Exclude<ReviewState, "none">, { bg: string; color: string }> = {
  pending:  { bg: "#FEF3C7", color: "#92400E" },
  approved: { bg: "#D1FAE5", color: "#065F46" },
  rejected: { bg: "#FEE2E2", color: "#991B1B" },
};

export default function ContentModerationPage() {
  const [drafts, setDrafts]   = useState<ContentDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [busy, setBusy]       = useState<string | null>(null);
  const [rejectId, setRejectId]     = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/content-moderation");
      const { drafts: data } = await asJson<{ drafts: ContentDraft[] }>(res);
      // Pending first (needs action), then most-recently-updated.
      data.sort((a, b) => {
        const ap = reviewState(a) === "pending" ? 0 : 1;
        const bp = reviewState(b) === "pending" ? 0 : 1;
        if (ap !== bp) return ap - bp;
        return (b.updated_at ?? "").localeCompare(a.updated_at ?? "");
      });
      setDrafts(data);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pendingCount = useMemo(
    () => drafts.filter((d) => reviewState(d) === "pending").length,
    [drafts],
  );

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleApprove(id: string) {
    setBusy(id + ":approve");
    try {
      await adminFetch(`/api/admin/content-creator/${id}/approve-review`, { method: "POST" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function handleReject(id: string) {
    setBusy(id + ":reject");
    try {
      await adminFetch(`/api/admin/content-creator/${id}/reject-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      setRejectId(null);
      setRejectReason("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1b4673", margin: 0 }}>
          Content Review
        </h1>
        <p style={{ color: "#6B7280", fontSize: 14, marginTop: 6 }}>
          Preview submitted content, then approve it (blog posts publish on approval) or send it back with feedback.
          {pendingCount > 0 && <> <strong style={{ color: "#92400E" }}>{pendingCount} pending.</strong></>}
        </p>
      </div>

      {error && (
        <div className="swa-alert swa-alert--error" style={{ marginBottom: 20 }}>{error}</div>
      )}

      {loading && (
        <div style={{ color: "#9CA3AF", padding: 40, textAlign: "center" }}>Loading…</div>
      )}

      {!loading && drafts.length === 0 && (
        <div style={{
          background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12,
          padding: 48, textAlign: "center", color: "#6B7280",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, display: "block", marginBottom: 12, color: "#D1D5DB" }}>
            rate_review
          </span>
          <p style={{ margin: 0, fontWeight: 600 }}>Nothing submitted for review yet</p>
          <p style={{ margin: "6px 0 0", fontSize: 13 }}>
            When someone submits a draft for review it appears here.
          </p>
        </div>
      )}

      {!loading && drafts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {drafts.map((draft) => {
            const rawRs = reviewState(draft);
            const rs: Exclude<ReviewState, "none"> = rawRs === "none" ? "pending" : rawRs;
            const stateStyle = STATE_STYLE[rs];
            const v = draft.verification;
            const submittedAt = v?.submitted_for_review_at
              ? new Date(v.submitted_for_review_at).toLocaleString() : "—";
            const submittedBy = v?.submitted_for_review_by ?? "—";
            const isApproving = busy === draft.id + ":approve";
            const isRejecting = busy === draft.id + ":reject";
            const isRejectOpen = rejectId === draft.id;
            const isExpanded = expanded.has(draft.id);
            const body = draft.body ?? "";

            return (
              <div key={draft.id} style={{
                background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{
                        background: "#d6eef7", color: "#1b4673", fontSize: 11, fontWeight: 700,
                        padding: "2px 8px", borderRadius: 999, textTransform: "uppercase",
                      }}>
                        {draft.content_type}
                      </span>
                      {/* Approved / review-state column */}
                      <span style={{
                        background: stateStyle.bg, color: stateStyle.color, fontSize: 11, fontWeight: 700,
                        padding: "2px 8px", borderRadius: 999, textTransform: "uppercase",
                      }}>
                        {REVIEW_STATE_LABEL[rs]}
                      </span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1b4673" }}>
                      {draft.title ?? "(No title)"}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, color: "#9CA3AF" }}>
                      Submitted {submittedAt} by <strong>{submittedBy}</strong>
                      {rs === "approved" && v?.approved_by && (
                        <> · <span style={{ color: "#065F46" }}>Approved by <strong>{v.approved_by}</strong></span></>
                      )}
                    </div>
                    {v?.rejection_reason && rs === "rejected" && (
                      <div style={{
                        marginTop: 8, padding: "8px 12px", background: "#FEF2F2", borderRadius: 6,
                        fontSize: 12, color: "#991B1B",
                      }}>
                        <strong>Rejected:</strong> {v.rejection_reason}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                    <button onClick={() => toggleExpand(draft.id)} className="swa-btn" style={{ fontSize: 12 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        {isExpanded ? "unfold_less" : "unfold_more"}
                      </span>
                      {isExpanded ? "Hide content" : "Preview content"}
                    </button>
                    <Link href={`/admin/content-creator/${draft.id}`} className="swa-btn" style={{ fontSize: 12 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span>
                      Open editor
                    </Link>
                    {rs === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(draft.id)}
                          disabled={!!busy}
                          className="swa-btn swa-btn--primary"
                          style={{ fontSize: 12 }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                          {isApproving ? "Approving…" : "Approve"}
                        </button>
                        <button
                          onClick={() => { setRejectId(isRejectOpen ? null : draft.id); setRejectReason(""); }}
                          disabled={!!busy}
                          className="swa-btn"
                          style={{ fontSize: 12, color: "#DC2626" }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>cancel</span>
                          {isRejectOpen ? "Cancel" : "Reject"}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Inline full-content preview — the "Content for review" view. */}
                {isExpanded && (
                  <div style={{
                    marginTop: 14, padding: 16, background: "#F9FAFB",
                    border: "1px solid #E5E7EB", borderRadius: 8,
                  }}>
                    {draft.title && (
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 12 }}>
                        {draft.title}
                      </div>
                    )}
                    {body.trim().length === 0 ? (
                      <div style={{ fontSize: 13, color: "#9CA3AF", fontStyle: "italic" }}>
                        This draft has no body content yet.
                      </div>
                    ) : (
                      <div style={{
                        maxHeight: 480, overflowY: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word",
                        fontSize: 14, lineHeight: 1.65, color: "#1F2937",
                      }}>
                        {body}
                      </div>
                    )}
                  </div>
                )}

                {isRejectOpen && (
                  <div style={{
                    marginTop: 14, padding: 14, background: "#FEF2F2", borderRadius: 8,
                    display: "flex", flexDirection: "column", gap: 8,
                  }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#991B1B" }}>
                      Rejection reason (shown to the author):
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      placeholder="Optional — explain what needs to change before resubmitting."
                      style={{
                        padding: "8px 10px", border: "1px solid #FECACA", borderRadius: 6,
                        fontSize: 13, fontFamily: "inherit", resize: "vertical", background: "#fff",
                      }}
                    />
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button
                        onClick={() => handleReject(draft.id)}
                        disabled={!!busy}
                        className="swa-btn"
                        style={{ fontSize: 12, background: "#DC2626", color: "#fff", borderColor: "#DC2626" }}
                      >
                        {isRejecting ? "Rejecting…" : "Confirm rejection"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
