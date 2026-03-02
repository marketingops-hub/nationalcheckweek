import Link from "next/link";

interface Props {
  backHref: string;
  backLabel: string;
}

export default function InnerNav({ backHref, backLabel }: Props) {
  return (
    <nav
      style={{
        background: "var(--navy)",
        padding: "0 40px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        borderBottom: "3px solid var(--accent)",
        boxShadow: "0 2px 20px rgba(0,0,0,0.25)",
      }}
    >
      <Link
        href="/"
        style={{ fontWeight: 700, fontSize: "1rem", color: "#FFFFFF", textDecoration: "none", fontFamily: "Inter, -apple-system, sans-serif", letterSpacing: "-0.01em" }}
      >
        <span style={{ color: "var(--teal-light)" }}>Schools</span>Wellbeing.com.au
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <Link
          href="/#map"
          style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.55)", textDecoration: "none", fontWeight: 500 }}
        >
          Map
        </Link>
        <Link
          href="/#issues"
          style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.55)", textDecoration: "none", fontWeight: 500 }}
        >
          Issues
        </Link>
        <Link
          href={backHref}
          style={{
            fontSize: "0.875rem",
            color: "rgba(255,255,255,0.85)",
            textDecoration: "none",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(255,255,255,0.08)",
            padding: "6px 14px",
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          ← {backLabel}
        </Link>
      </div>
    </nav>
  );
}
