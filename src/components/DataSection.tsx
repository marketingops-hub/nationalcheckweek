export default function DataSection() {
  return (
    <section className="section section-dark" id="data">
      <div className="section-tag">Methodology &amp; Data Sources</div>
      <h2>How This Site Uses Data</h2>
      <p className="section-lead">
        A mixed-model approach: national anchors for comparability, plus region-specific datasets where they exist. Gaps are disclosed, not hidden.
      </p>
      <div className="data-grid">
        <div className="data-box">
          <div className="data-box-title">Primary Sources</div>
          <p>
            AIHW Youth Self-Harm Atlas (PHN/SA3/SA4)<br />
            Young Minds Matter Survey (2013–14)<br />
            Mission Australia Youth Survey (2024)<br />
            eSafety Commissioner Online Experiences Survey<br />
            Productivity Commission RoGS 2026<br />
            QLD Auditor-General Report 6 (2024–25)<br />
            Black Dog Institute Teens &amp; Screens (2024)<br />
            Australian Parliamentary Library Research Papers
          </p>
        </div>
        <div className="data-box">
          <div className="data-box-title">Data Limitations</div>
          <p>
            <strong style={{ color: "rgba(246,239,228,0.85)" }}>Bullying:</strong> No single national prevalence rate due to inconsistent collection across jurisdictions.
          </p>
          <p>
            <strong style={{ color: "rgba(246,239,228,0.85)" }}>Regional data:</strong> Not all issues have sub-state datasets. Where gaps exist, national or remoteness-level data is used.
          </p>
          <p>
            <strong style={{ color: "rgba(246,239,228,0.85)" }}>Survey years:</strong> Some sources date from 2013–14. The most recent available data is used throughout.
          </p>
        </div>
      </div>
    </section>
  );
}
