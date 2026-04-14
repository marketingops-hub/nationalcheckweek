import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import FaqAccordion from "./FaqAccordion";

export const metadata: Metadata = {
  title: "FAQ | National Check-In Week",
  description: "Find answers to common questions about National Check-In Week.",
};

export const revalidate = 3600;

export default async function FaqPage() {
  const sb = await createClient();
  const { data } = await sb
    .from("Faq")
    .select("id, question, answer")
    .eq("active", true)
    .order("sortOrder", { ascending: true })
    .order("createdAt", { ascending: false });

  const faqs = data ?? [];

  return (
    <>
      <div className="page-hero page-hero--centered">
        <div className="page-hero__inner">
          <div className="hero-tag">❓ Help Centre</div>
          <h1 className="page-hero__title">Frequently Asked Questions</h1>
          <p className="page-hero__subtitle">
            Find answers to common questions about National Check-In Week
          </p>
        </div>
      </div>

      <main className="inner-content" id="main-content">
        {faqs.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--text-light)", padding: "48px 0" }}>
            No FAQs available yet.
          </p>
        ) : (
          <FaqAccordion faqs={faqs} />
        )}
      </main>
    </>
  );
}
