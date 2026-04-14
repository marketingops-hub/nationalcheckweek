"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  entitySlug: string;
  entityType?: string;
  sourcesHref?: string;
  label?: string;
}

interface Counts { up: number; down: number; total: number; }

export default function VoteFeedback({
  entitySlug,
  entityType = "issue",
  sourcesHref,
  label = "this data",
}: Props) {
  const [counts, setCounts]     = useState<Counts>({ up: 0, down: 0, total: 0 });
  const [voted, setVoted]       = useState<"up" | "down" | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [contact, setContact]   = useState("");
  const [sending, setSending]   = useState(false);
  const [done, setDone]         = useState(false);
  const dialogRef               = useRef<HTMLDivElement>(null);

  // Load counts on mount
  useEffect(() => {
    fetch(`/api/votes?slug=${entitySlug}&type=${entityType}`)
      .then((r) => r.json())
      .then((d) => { if (d.up !== undefined) setCounts(d); })
      .catch(() => {});
  }, [entitySlug, entityType]);

  // Close on Escape
  useEffect(() => {
    if (!showForm) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setShowForm(false); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [showForm]);

  async function castVote(v: "up" | "down") {
    if (voted) return;
    setVoted(v);
    // Optimistic update
    setCounts((c) => ({ ...c, [v]: c[v] + 1, total: c.total + 1 }));

    if (v === "down") {
      setShowForm(true);
      return;
    }
    // Up vote — submit silently
    await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity_type: entityType, entity_slug: entitySlug, vote: v }),
    }).catch(() => {});
  }

  async function submitFeedback(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity_type: entityType,
        entity_slug: entitySlug,
        vote: "down",
        feedback,
        contact,
      }),
    }).catch(() => {});
    setSending(false);
    setDone(true);
    setTimeout(() => setShowForm(false), 2000);
  }

  const upPct  = counts.total > 0 ? Math.round((counts.up   / counts.total) * 100) : null;

  return (
    <>
      <div className="vote-bar">
        <span className="vote-bar__label">Is {label} accurate?</span>

        <div className="vote-bar__actions">
          <button
            className={`vote-btn vote-btn--up${voted === "up" ? " vote-btn--active" : ""}`}
            onClick={() => castVote("up")}
            disabled={!!voted}
            aria-label="Thumbs up — I support this data"
            title="This data looks accurate"
          >
            <ThumbUp /> {counts.up > 0 && <span>{counts.up}</span>}
          </button>

          <button
            className={`vote-btn vote-btn--down${voted === "down" ? " vote-btn--active" : ""}`}
            onClick={() => castVote("down")}
            disabled={!!voted}
            aria-label="Thumbs down — I question this data"
            title="I question this data"
          >
            <ThumbDown /> {counts.down > 0 && <span>{counts.down}</span>}
          </button>

          {upPct !== null && (
            <span className="vote-bar__pct">{upPct}% support</span>
          )}
        </div>

        {sourcesHref && (
          <a href={sourcesHref} className="vote-bar__sources-link">
            View sources ↗
          </a>
        )}
      </div>

      {/* FEEDBACK POPUP */}
      {showForm && (
        <div
          className="vote-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Data feedback"
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div className="vote-dialog" ref={dialogRef}>
            <button
              className="vote-dialog__close"
              onClick={() => setShowForm(false)}
              aria-label="Close"
            >✕</button>

            {done ? (
              <div className="vote-dialog__done">
                <div style={{ fontSize: "2rem", marginBottom: 12 }}>✅</div>
                <h3>Thank you for your feedback</h3>
                <p>We review all challenges and update our sources accordingly.</p>
              </div>
            ) : (
              <>
                <div className="vote-dialog__header">
                  <span style={{ fontSize: "1.5rem" }}>👎</span>
                  <div>
                    <h3 className="vote-dialog__title">Challenge this data</h3>
                    <p className="vote-dialog__subtitle">
                      Tell us what you think is inaccurate or outdated — we take every challenge seriously.
                    </p>
                  </div>
                </div>

                <form onSubmit={submitFeedback} className="vote-dialog__form">
                  <label className="vote-dialog__label">
                    What concerns you about this data?
                    <textarea
                      className="vote-dialog__textarea"
                      placeholder="e.g. This statistic is from 2013 — there is newer data from 2023..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={4}
                      required
                    />
                  </label>

                  <label className="vote-dialog__label">
                    Your email (optional — only if you want a response)
                    <input
                      type="email"
                      className="vote-dialog__input"
                      placeholder="you@example.com"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                    />
                  </label>

                  <div className="vote-dialog__footer">
                    <button
                      type="button"
                      className="vote-dialog__cancel"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="vote-dialog__submit"
                      disabled={sending || !feedback.trim()}
                    >
                      {sending ? "Sending…" : "Submit feedback"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ThumbUp() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
    </svg>
  );
}

function ThumbDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
    </svg>
  );
}
