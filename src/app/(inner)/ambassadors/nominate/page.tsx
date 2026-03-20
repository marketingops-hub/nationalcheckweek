import { createClient } from "@/lib/supabase/server";
import NominateForm from "@/components/NominateForm";
import Link from "next/link";

export const metadata = {
  title: "Nominate an Ambassador — Schools Wellbeing Australia",
  description: "Know someone who champions student wellbeing? Nominate them to become a Schools Wellbeing Ambassador.",
};

export default async function NominatePage() {
  const sb = await createClient();
  const { data } = await sb
    .from("ambassador_categories")
    .select("id, name, slug, icon, color")
    .order("name");

  const categories = data ?? [];

  return (
    <>
      <div className="page-hero page-hero--centered">
        <div className="page-hero__inner">
          <div className="hero-tag">⭐ Nominate Someone</div>
          <h1 className="page-hero__title">Nominate an Ambassador</h1>
          <p className="page-hero__subtitle">
            Know a teacher, school leader, or health professional making a real difference for student wellbeing? Nominate them today.
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
            background: "#fefce8", border: "1px solid #fde68a",
            borderRadius: "var(--radius-md)", padding: "20px 24px",
            display: "flex", gap: 16, alignItems: "flex-start",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#d97706", flexShrink: 0, marginTop: 2 }}>star</span>
            <div>
              <div style={{ fontWeight: 700, color: "var(--dark)", marginBottom: 4 }}>The person you nominate doesn't need to know</div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-mid)", lineHeight: 1.7 }}>
                You can nominate someone without them knowing. If accepted, our team will reach out to them directly with the good news. Their email address is optional — we just need enough detail to identify them.
              </p>
            </div>
          </div>
        </div>

        <NominateForm categories={categories} />
      </main>
    </>
  );
}
