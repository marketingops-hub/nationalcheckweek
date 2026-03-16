import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Sources & References — National Check-in Week",
  description:
    "Every data claim on this site is backed by a published source. Browse our full reference repository and hold us accountable.",
};

export const revalidate = 60;

interface Source {
  id: string;
  title: string;
  url: string | null;
  publisher: string;
  year: string;
  verified: boolean;
  issue_slug: string;
  issue_title: string;
  issue_icon: string;
}

export default async function SourcesPage() {
  let sources: Source[] = [];
  let fetchError = "";

  try {
    const sb = await createClient();
    // issue_sources stores all sources added via the issue editor
    const { data, error } = await sb
      .from("issue_sources")
      .select("id, title, url, publisher, year, verified, issues(slug, title, icon)")
      .order("title");
    if (error) fetchError = error.message;
    sources = (data ?? []).map((row: Record<string, unknown>) => {
      const iss = row.issues as Record<string, string> | null;
      return {
        id: row.id as string,
        title: row.title as string,
        url: (row.url as string) || null,
        publisher: (row.publisher as string) || "",
        year: (row.year as string) || "",
        verified: Boolean(row.verified),
        issue_slug: iss?.slug ?? "",
        issue_title: iss?.title ?? "",
        issue_icon: iss?.icon ?? "",
      };
    });
  } catch (e) {
    fetchError = e instanceof Error ? e.message : "Failed to load sources.";
  }

  // Group by issue
  const grouped: Record<string, Source[]> = {};
  for (const src of sources) {
    const key = src.issue_slug || "general";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(src);
  }
  const issueKeys = Object.keys(grouped).sort();

  return (
    <>
      <div className="page-hero page-hero--centered">
        <div className="page-hero__inner" style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <div className="section-tag" style={{ margin: "0 auto 16px" }}>
            Transparency · Accountability
          </div>
          <h1 className="page-hero__title" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>
            Sources &amp; References
          </h1>
          <p className="page-hero__subtitle" style={{ margin: "0 auto" }}>
            Every data claim on this site is backed by a published, verifiable source.
            This page is our public accountability register. If you think a source is inaccurate or outdated,
            use the feedback tool on the relevant data section.
          </p>
        </div>
      </div>

      <main id="main-content" className="inner-content">

        {/* ACCOUNTABILITY NOTE */}
        <div className="prevention-bridge" style={{ marginBottom: 40 }}>
          <div className="eyebrow-tag">Our commitment</div>
          <h3 className="prevention-bridge__heading">We cite everything. Challenge us if we got it wrong.</h3>
          <div className="prevention-bridge__body">
            <p>
              Every statistic, claim, and data point on this site is drawn from government reports,
              peer-reviewed research, or publicly available institutional data. Verified sources are
              marked <strong style={{ color: "var(--green)" }}>✓ Verified</strong>.
              If you believe a source is inaccurate, outdated, or misrepresented — use the{" "}
              <strong>thumbs down</strong> feedback on any data section to tell us.
            </p>
          </div>
        </div>

        {fetchError && (
          <div style={{
            background: "var(--red-bg)", border: "1px solid var(--red)", borderRadius: 8,
            padding: "16px 20px", marginBottom: 32, color: "var(--red)", fontSize: "0.9rem"
          }}>
            {fetchError}
          </div>
        )}

        {sources.length === 0 && !fetchError && (
          <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--text-light)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>📚</div>
            <p>Sources are being added. Check back soon.</p>
          </div>
        )}

        {/* GROUPED BY ISSUE */}
        {issueKeys.map((key) => {
          const grp = grouped[key];
          const first = grp[0];
          return (
            <section key={key} style={{ marginBottom: 48 }}>
              <h2 className="section-heading section-heading--md">
                {first.issue_icon && <span style={{ marginRight: 8 }}>{first.issue_icon}</span>}
                {first.issue_title || key}
                <span style={{
                  fontSize: "0.75rem", fontWeight: 600, color: "var(--text-light)",
                  background: "var(--gray-100)", borderRadius: 100, padding: "2px 10px",
                  marginLeft: 10, verticalAlign: "middle"
                }}>
                  {grp.length} source{grp.length !== 1 ? "s" : ""}
                </span>
                {first.issue_slug && (
                  <a
                    href={`/issues/${first.issue_slug}`}
                    style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--teal)", marginLeft: 12, verticalAlign: "middle" }}
                  >
                    View issue →
                  </a>
                )}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {grp.map((src) => (
                  <div key={src.id} className="source-item">
                    <span className={`source-num${src.verified ? " source-num--verified" : ""}`}>
                      {src.verified ? "✓" : "·"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div className="source-title">
                        {src.url ? (
                          <a href={src.url} target="_blank" rel="noopener noreferrer">{src.title}</a>
                        ) : src.title}
                        {src.verified && <span className="source-verified">VERIFIED</span>}
                      </div>
                      <div className="source-meta">
                        {src.publisher}{src.publisher && src.year ? " · " : ""}{src.year}
                        {src.url && (
                          <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8 }}>
                            ↗ View source
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

      </main>
    </>
  );
}
