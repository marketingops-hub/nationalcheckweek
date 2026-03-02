import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <nav style={{
        background: "var(--navy)", padding: "0 40px", height: "64px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "3px solid var(--accent)",
      }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: "1rem", color: "#FFFFFF", textDecoration: "none" }}>
          <span style={{ color: "var(--teal-light)" }}>Schools</span>Wellbeing.com.au
        </Link>
      </nav>

      <div style={{
        minHeight: "calc(100vh - 64px)",
        background: "var(--navy)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "48px 24px", textAlign: "center",
      }}>
        <div style={{
          fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "var(--teal-light)", marginBottom: "20px",
        }}>
          404 — Page Not Found
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
          color: "#FFFFFF", lineHeight: 1.1, marginBottom: "20px",
        }}>
          This page doesn&apos;t exist
        </h1>
        <p style={{
          fontSize: "1.05rem", color: "rgba(255,255,255,0.62)",
          lineHeight: 1.75, maxWidth: "480px", marginBottom: "40px",
        }}>
          The page you&apos;re looking for may have moved, been renamed, or never existed.
          Head back to the monitor to explore student wellbeing data by state and issue.
        </p>

        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "var(--accent)", color: "#FFFFFF",
            fontWeight: 700, fontSize: "0.95rem", padding: "13px 26px",
            borderRadius: "8px", textDecoration: "none",
          }}>
            ← Back to Monitor
          </Link>
          <Link href="/#map" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(255,255,255,0.08)", color: "#FFFFFF",
            fontWeight: 600, fontSize: "0.95rem", padding: "13px 26px",
            borderRadius: "8px", textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.15)",
          }}>
            Explore the Map
          </Link>
        </div>

        <div style={{
          marginTop: "64px", display: "flex", gap: "32px",
          flexWrap: "wrap", justifyContent: "center",
        }}>
          {[
            { href: "/states/new-south-wales", label: "NSW" },
            { href: "/states/victoria", label: "VIC" },
            { href: "/states/queensland", label: "QLD" },
            { href: "/states/western-australia", label: "WA" },
            { href: "/issues/anxiety-depression", label: "Anxiety" },
            { href: "/issues/self-harm-suicidality", label: "Self-Harm" },
          ].map(l => (
            <Link key={l.href} href={l.href} style={{
              fontSize: "0.875rem", color: "rgba(255,255,255,0.5)",
              textDecoration: "none", fontWeight: 500,
              transition: "color 0.2s",
            }}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
