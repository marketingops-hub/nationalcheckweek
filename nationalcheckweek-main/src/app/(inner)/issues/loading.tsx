export default function IssuesLoading() {
  return (
    <>
      <div className="page-hero page-hero--centered">
        <div className="page-hero__inner" style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <div className="skel skel-text" style={{ width: 200, height: 28, borderRadius: 4, margin: "0 auto 16px" }} />
          <div className="skel skel-text" style={{ width: "55%", height: 40, margin: "0 auto 20px" }} />
          <div className="skel skel-text" style={{ width: "75%", height: 18, margin: "0 auto 8px" }} />
          <div className="skel skel-text" style={{ width: "60%", height: 18, margin: "0 auto" }} />
        </div>
      </div>
      <div className="inner-content inner-content--wide">
        <div style={{ display: "flex", gap: 16, marginBottom: 40 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skel skel-text" style={{ width: 160, height: 28, borderRadius: 100 }} />
          ))}
        </div>
        <div className="skel skel-text" style={{ width: 220, height: 22, marginBottom: 24 }} />
        <div className="issues-grid">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="issue-card" style={{ pointerEvents: "none" }}>
              <div className="skel" style={{ height: 4 }} />
              <div className="card-body">
                <div className="skel skel-text" style={{ width: 40, height: 36, marginBottom: 14 }} />
                <div className="skel skel-text" style={{ width: "70%", height: 20, marginBottom: 10 }} />
                <div className="skel skel-text" style={{ width: "55%", height: 16, marginBottom: 10 }} />
                <div className="skel skel-text" style={{ width: "100%", height: 14, marginBottom: 6 }} />
                <div className="skel skel-text" style={{ width: "85%", height: 14 }} />
              </div>
              <div className="card-footer">
                <div className="skel skel-text" style={{ width: 80, height: 22, borderRadius: 100 }} />
                <div className="skel skel-text" style={{ width: 100, height: 16 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
