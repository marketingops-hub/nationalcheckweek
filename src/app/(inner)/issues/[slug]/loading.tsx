export default function IssueLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <div className="page-hero" style={{ borderBottomColor: "var(--border)" }}>
        <div className="page-hero__inner">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div className="skel skel-text" style={{ width: 100, height: 14 }} />
            <div className="skel skel-text" style={{ width: 80, height: 22, borderRadius: 100 }} />
          </div>
          <div className="skel skel-text" style={{ width: 48, height: 40, borderRadius: 8, marginBottom: 16 }} />
          <div className="skel skel-text" style={{ width: "60%", height: 36, marginBottom: 16 }} />
          <div className="skel skel-text" style={{ width: "80%", height: 20, marginBottom: 8 }} />
          <div className="skel skel-text" style={{ width: "65%", height: 20, marginBottom: 24 }} />
          <div className="skel skel-text" style={{ width: "50%", height: 18 }} />
        </div>
      </div>

      {/* Info note skeleton */}
      <div style={{ padding: "20px 40px", borderBottom: "1px solid var(--border)", background: "#EFF6FF" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", gap: 14 }}>
          <div className="skel skel-text" style={{ width: 24, height: 24, borderRadius: 4, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skel skel-text" style={{ width: "90%", height: 16, marginBottom: 8 }} />
            <div className="skel skel-text" style={{ width: "70%", height: 16 }} />
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="inner-content">
        {[1, 2, 3].map((i) => (
          <div key={i} className="inner-section">
            <div className="skel skel-text" style={{ width: 200, height: 20, marginBottom: 20 }} />
            <div className="skel skel-text" style={{ width: "100%", height: 16, marginBottom: 8 }} />
            <div className="skel skel-text" style={{ width: "95%", height: 16, marginBottom: 8 }} />
            <div className="skel skel-text" style={{ width: "85%", height: 16 }} />
          </div>
        ))}

        {/* Impact grid skeleton */}
        <div className="inner-section">
          <div className="skel skel-text" style={{ width: 160, height: 20, marginBottom: 20 }} />
          <div className="impact-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="impact-card">
                <div className="skel skel-text" style={{ width: "60%", height: 14, marginBottom: 10 }} />
                <div className="skel skel-text" style={{ width: "100%", height: 13, marginBottom: 6 }} />
                <div className="skel skel-text" style={{ width: "80%", height: 13 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
