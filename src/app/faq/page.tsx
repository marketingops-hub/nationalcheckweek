"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Faq {
  id: string;
  question: string;
  answer: string;
  category?: string | null;
}

export default function FaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/faq")
      .then((r) => r.json())
      .then((d) => setFaqs(d.faqs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Group by category
  const grouped: Record<string, Faq[]> = {};
  faqs.forEach((f) => {
    const cat = f.category || "General";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(f);
  });
  const categories = Object.keys(grouped);

  return (
    <>
      {/* Nav */}
      <nav style={{
        background: "var(--navy)", padding: "0 40px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
        borderBottom: "3px solid var(--accent)", boxShadow: "0 2px 20px rgba(0,0,0,0.25)",
      }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: "1rem", color: "#FFFFFF", textDecoration: "none", fontFamily: "Inter, -apple-system, sans-serif" }}>
          <span style={{ color: "var(--teal-light)" }}>Schools</span>Wellbeing.com.au
        </Link>
        <Link href="/" style={{
          fontSize: "0.875rem", color: "rgba(255,255,255,0.85)", textDecoration: "none", fontWeight: 600,
          display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)",
          padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)",
        }}>
          ← Home
        </Link>
      </nav>

      {/* Hero */}
      <div style={{ background: "var(--navy)", padding: "64px 40px 56px", textAlign: "center" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--teal-light)", background: "rgba(14,116,144,0.15)",
            border: "1px solid rgba(34,211,238,0.2)", padding: "6px 14px", borderRadius: 100, marginBottom: 20,
          }}>
            ❓ Help Centre
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: "#FFFFFF", lineHeight: 1.2, marginBottom: 16, fontFamily: "'Playfair Display', Georgia, serif" }}>
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.8, maxWidth: 560, margin: "0 auto" }}>
            Find answers to common questions about Schools Wellbeing Australia
          </p>
        </div>
      </div>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "56px 40px 80px" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-light)" }}>Loading...</div>
        )}

        {!loading && faqs.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <p style={{ fontSize: "1.1rem", color: "var(--text-light)" }}>FAQs will appear here once added.</p>
          </div>
        )}

        {!loading && categories.map((cat) => (
          <div key={cat} style={{ marginBottom: 40 }}>
            {categories.length > 1 && (
              <h2 style={{
                fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: "var(--teal)", marginBottom: 16, paddingBottom: 8,
                borderBottom: "2px solid var(--border)",
              }}>
                {cat}
              </h2>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {grouped[cat].map((f) => {
                const isOpen = openId === f.id;
                return (
                  <div key={f.id} style={{
                    border: "1px solid var(--border)", borderRadius: 10, background: "var(--white)",
                    overflow: "hidden", transition: "border-color 0.2s",
                    ...(isOpen ? { borderColor: "var(--teal)" } : {}),
                  }}>
                    <button
                      onClick={() => setOpenId(isOpen ? null : f.id)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "18px 22px", background: "none", border: "none", cursor: "pointer",
                        textAlign: "left", fontSize: "1rem", fontWeight: 600, color: "var(--navy)",
                        fontFamily: "inherit",
                      }}
                    >
                      <span>{f.question}</span>
                      <span style={{
                        fontSize: "1.2rem", color: "var(--teal)", flexShrink: 0, marginLeft: 16,
                        transform: isOpen ? "rotate(45deg)" : "none", transition: "transform 0.2s",
                      }}>
                        +
                      </span>
                    </button>
                    {isOpen && (
                      <div style={{
                        padding: "0 22px 20px", fontSize: "0.95rem", color: "var(--text-mid)",
                        lineHeight: 1.8, whiteSpace: "pre-wrap",
                      }}>
                        {f.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>

      {/* Simple footer */}
      <div style={{ background: "var(--navy)", padding: "24px 40px", textAlign: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", margin: 0 }}>
          © {new Date().getFullYear()} SchoolsWellbeing.com.au
        </p>
      </div>
    </>
  );
}
