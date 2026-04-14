import ApplyFormClient from "@/components/ambassadors/ApplyFormClient";
import Link from "next/link";

export const metadata = {
  title: "Become an Ambassador — National Check-in Week",
  description: "Apply to become a National Check-in Week Ambassador and champion student wellbeing across Australia.",
};

export default function ApplyPage() {
  return (
    <>
      <div className="page-hero page-hero--centered">
        <div className="page-hero__inner">
          <div className="hero-tag">🤝 Get Involved</div>
          <h1 className="page-hero__title">Become an Ambassador</h1>
          <p className="page-hero__subtitle">
            Apply to join our network of educators, health professionals and community leaders championing student wellbeing across Australia
          </p>
        </div>
      </div>

      <main className="inner-content">

        {/* Intro + breadcrumb */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ marginBottom: 20 }}>
            <Link href="/ambassadors" style={{ fontSize: 13, color: "var(--primary)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>arrow_back</span>
              Back to Ambassadors
            </Link>
          </div>
          <div style={{
            background: "#f0f9ff", border: "1px solid #bae6fd",
            borderRadius: "var(--radius-md)", padding: "20px 24px",
            display: "flex", gap: 16, alignItems: "flex-start",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#0284c7", flexShrink: 0, marginTop: 2 }}>info</span>
            <div>
              <div style={{ fontWeight: 700, color: "var(--dark)", marginBottom: 4 }}>What happens after you apply?</div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-mid)", lineHeight: 1.7 }}>
                Our team reviews every application personally. If successful, you'll receive an invitation to join the program, access to resources, and recognition on this platform. We aim to respond within 2 weeks.
              </p>
            </div>
          </div>
        </div>

        <ApplyFormClient />
      </main>
    </>
  );
}
