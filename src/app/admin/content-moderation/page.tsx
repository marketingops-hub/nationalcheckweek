"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/adminFetch";
import { asJson } from "@/lib/content-creator/http";
import type { ContentDraft } from "@/lib/content-creator/types";

export default function ContentModerationPage() {
  const [drafts, setDrafts]   = useState<ContentDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [busy, setBusy]       = useState<string | null>(null);
  const [rejectId, setRejectId]     = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/content-moderation");
      const { drafts: data } = await asJson<{ drafts: ContentDraft[] }>(res);
      setDrafts(data);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
          Content Moderation
        </h1>
        <p style={{ color: "#6B7280", fontSize: 14, marginTop: 6 }}>
          Review and approve content before it publishes to the blog.
        </p>
      </div>

      {error && (
        <div className="swa-alert swa-alert--error" style={{ marginBottom: 20 }}>
          {error}
        </div>
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
          <p style={{ margin: 0, fontWeight: 600 }}>No drafts pending review</p>
          <p style={{ margin: "6px 0 0", fontSize: 13 }}>
            When editors submit drafts for review they will appear here.
          </p>
        </div>
      )}

      {!loading && drafts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {drafts.map((draft) => {
            const submittedAt = draft.verification?.submitted_for_review_at
              ? new Date(draft.verification.submitted_for_review_at).toLocaleString()
              : "—";
            const submittedBy = draft.verification?.submitted_for_review_by ?? "—";
            const isApproving = busy === draft.id + ":approve";
            const isRejecting = busy === draft.id + ":reject";
            const isRejectOpen = rejectId === draft.id;

            return (
              <div key={draft.id} style={{
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                padding: 20,
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
                      <span style={{
                        background: "#FEF3C7", color: "#92400E", fontSize: 11, fontWeight: 700,
                        padding: "2px 8px", borderRadius: 999, textTransform: "uppercase",
                      }}>
                        {draft.status}
                      </span>
                    </div>
                    <Link
                      href={`/admin/content-creator/${draft.id}`}
                      style={{ fontSize: 16, fontWeight: 700, color: "#1b4673", textDecoration: "none" }}
                    >
                      {draft.title ?? "(No title)"}
                    </Link>
                    <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>
                      {(draft.body ?? "").slice(0, 200).replace(/\n/g, " ")}
                      {(draft.body ?? "").length > 200 ? "…" : ""}
                    </p>
                    <div style={{ marginTop: 10, fontSize: 12, color: "#9CA3AF" }}>
                      Submitted {submittedAt} by <strong>{submittedBy}</strong>
                    </div>
                    {draft.verification?.rejection_reason && (
                      <div style={{
                        marginTop: 8, padding: "8px 12px",
                        background: "#FEF2F2", borderRadius: 6,
                        fontSize: 12, color: "#991B1B",
                      }}>
                        <strong>Previously rejected:</strong> {draft.verification.rejection_reason}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                    <Link
                      href={`/admin/content-creator/${draft.id}`}
                      className="swa-btn"
                      style={{ fontSize: 12 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span>
                      View draft
                    </Link>
                    <button
                      onClick={() => handleApprove(draft.id)}
                      disabled={!!busy}
                      className="swa-btn swa-btn--primary"
                      style={{ fontSize: 12 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                      {isApproving ? "Approving…" : "Approve & publish"}
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
                  </div>
                </div>

                {isRejectOpen && (
                  <div style={{
                    marginTop: 14, padding: 14,
                    background: "#FEF2F2", borderRadius: 8,
                    display: "flex", flexDirection: "column", gap: 8,
                  }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#991B1B" }}>
                      Rejection reason (shown to the editor):
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
