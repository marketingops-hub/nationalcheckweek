import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export const dynamic = "force-dynamic";

export default async function AdminVotesPage() {
  const sb = adminClient();

  // Fetch negative votes with feedback, newest first
  const { data: negativeVotes, error: negErr } = await sb
    .from("data_votes")
    .select("id,entity_type,entity_slug,vote,feedback,contact,created_at")
    .eq("vote", "down")
    .order("created_at", { ascending: false });

  // Fetch aggregate counts per entity
  const { data: counts, error: countErr } = await sb
    .from("data_vote_counts")
    .select("entity_type,entity_slug,up_count,down_count,total")
    .order("down_count", { ascending: false });

  const err = negErr?.message || countErr?.message;

  const withFeedback = (negativeVotes ?? []).filter((v) => v.feedback);
  const withoutFeedback = (negativeVotes ?? []).filter((v) => !v.feedback);

  return (
    <div>
      {/* Page header */}
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Data Votes &amp; Feedback</h1>
          <p className="swa-page-subtitle">
            Public accountability — see what users support or challenge, and why.
          </p>
        </div>
      </div>

      {err && (
        <div className="swa-alert swa-alert--error" style={{ marginBottom: 24 }}>
          {err}
        </div>
      )}

      {/* SUMMARY STATS */}
      <div className="swa-stats-row" style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 32 }}>
        <StatCard
          label="Total negative votes"
          value={negativeVotes?.length ?? 0}
          color="red"
          icon="thumb_down"
        />
        <StatCard
          label="With written feedback"
          value={withFeedback.length}
          color="amber"
          icon="feedback"
        />
        <StatCard
          label="Total entities voted on"
          value={counts?.length ?? 0}
          color="blue"
          icon="poll"
        />
      </div>

      {/* AGGREGATE TABLE */}
      <div className="swa-section" style={{ marginBottom: 40 }}>
        <h2 className="swa-section-title">Vote summary by page</h2>
        {!counts?.length ? (
          <p className="swa-empty">No votes recorded yet.</p>
        ) : (
          <table className="swa-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Type</th>
                <th style={{ textAlign: "center", color: "var(--swa-green)" }}>👍 Up</th>
                <th style={{ textAlign: "center", color: "var(--swa-red)" }}>👎 Down</th>
                <th style={{ textAlign: "center" }}>Total</th>
                <th style={{ textAlign: "center" }}>Support %</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {counts.map((row) => {
                const pct = row.total > 0
                  ? Math.round((row.up_count / row.total) * 100)
                  : null;
                const isLow = pct !== null && pct < 60;
                return (
                  <tr key={`${row.entity_type}-${row.entity_slug}`}>
                    <td><code style={{ fontSize: "0.8rem" }}>{row.entity_slug}</code></td>
                    <td>
                      <span className="swa-badge swa-badge--gray">{row.entity_type}</span>
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 700, color: "var(--swa-green)" }}>
                      {row.up_count}
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 700, color: "var(--swa-red)" }}>
                      {row.down_count}
                    </td>
                    <td style={{ textAlign: "center" }}>{row.total}</td>
                    <td style={{ textAlign: "center" }}>
                      {pct !== null ? (
                        <span style={{
                          fontWeight: 700,
                          color: isLow ? "var(--swa-red)" : "var(--swa-green)",
                        }}>
                          {pct}%
                        </span>
                      ) : "—"}
                    </td>
                    <td>
                      <a
                        href={row.entity_type === "issue" ? `/issues/${row.entity_slug}` : `/${row.entity_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="swa-link"
                        style={{ fontSize: "0.8rem" }}
                      >
                        View page ↗
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* NEGATIVE FEEDBACK — WITH TEXT */}
      <div className="swa-section" style={{ marginBottom: 40 }}>
        <h2 className="swa-section-title">
          👎 Challenges with written feedback
          <span className="swa-badge swa-badge--red" style={{ marginLeft: 10 }}>{withFeedback.length}</span>
        </h2>
        <p className="swa-page-subtitle" style={{ marginBottom: 20 }}>
          These users provided a reason for questioning the data — review and update sources as needed.
        </p>
        {!withFeedback.length ? (
          <p className="swa-empty">No written challenges yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {withFeedback.map((v) => (
              <FeedbackCard key={v.id} vote={v} />
            ))}
          </div>
        )}
      </div>

      {/* NEGATIVE VOTES — NO FEEDBACK */}
      {withoutFeedback.length > 0 && (
        <div className="swa-section">
          <h2 className="swa-section-title">
            👎 Challenges without feedback
            <span className="swa-badge swa-badge--gray" style={{ marginLeft: 10 }}>{withoutFeedback.length}</span>
          </h2>
          <table className="swa-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Type</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {withoutFeedback.map((v) => (
                <tr key={v.id}>
                  <td><code style={{ fontSize: "0.8rem" }}>{v.entity_slug}</code></td>
                  <td><span className="swa-badge swa-badge--gray">{v.entity_type}</span></td>
                  <td style={{ fontSize: "0.82rem", color: "var(--swa-text-muted)" }}>
                    {new Date(v.created_at).toLocaleDateString("en-AU", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon }: {
  label: string; value: number; color: string; icon: string;
}) {
  const colors: Record<string, { bg: string; text: string }> = {
    red:   { bg: "#FEF2F2", text: "#DC2626" },
    amber: { bg: "#FFFBEB", text: "#D97706" },
    blue:  { bg: "#EFF6FF", text: "#2563EB" },
    green: { bg: "#F0FDF4", text: "#16A34A" },
  };
  const c = colors[color] ?? colors.blue;
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.text}22`,
      borderRadius: 12, padding: "18px 24px",
      minWidth: 180, flex: "1 1 180px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: c.text }}>{icon}</span>
        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: c.text, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: "2rem", fontWeight: 800, color: c.text, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function FeedbackCard({ vote }: { vote: Record<string, string> }) {
  const date = new Date(vote.created_at).toLocaleDateString("en-AU", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  return (
    <div style={{
      background: "#FFFBEB",
      border: "1px solid #FDE68A",
      borderLeft: "4px solid #F59E0B",
      borderRadius: 10,
      padding: "18px 20px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="swa-badge swa-badge--red">👎 Challenge</span>
          <code style={{ fontSize: "0.82rem", background: "#FEF3C7", padding: "2px 8px", borderRadius: 4 }}>
            {vote.entity_type}/{vote.entity_slug}
          </code>
        </div>
        <span style={{ fontSize: "0.78rem", color: "#92400E" }}>{date}</span>
      </div>
      <blockquote style={{
        margin: 0, padding: "12px 16px",
        background: "#FFFFFF", borderRadius: 7,
        border: "1px solid #FDE68A",
        fontSize: "0.9rem", lineHeight: 1.7,
        color: "#1C1917", fontStyle: "italic",
      }}>
        &ldquo;{vote.feedback}&rdquo;
      </blockquote>
      {vote.contact && (
        <div style={{ marginTop: 10, fontSize: "0.8rem", color: "#78350F" }}>
          <span style={{ fontWeight: 600 }}>Contact: </span>
          <a href={`mailto:${vote.contact}`} style={{ color: "#B45309" }}>{vote.contact}</a>
        </div>
      )}
    </div>
  );
}
