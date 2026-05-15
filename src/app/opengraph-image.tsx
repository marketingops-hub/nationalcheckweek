import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "National Check-in Week — Supporting Student Wellbeing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0B1D35 0%, #1E3A5F 100%)",
          padding: "64px",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Top badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(34,211,238,0.12)",
            border: "1px solid rgba(34,211,238,0.25)",
            borderRadius: "100px",
            padding: "8px 20px",
            width: "fit-content",
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22D3EE" }} />
          <span style={{ fontSize: 18, fontWeight: 600, color: "#22D3EE", letterSpacing: "0.08em", fontFamily: "sans-serif" }}>
            AUSTRALIAN SCHOOLS WELLBEING MONITOR · 2024–25
          </span>
        </div>

        {/* Main headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontSize: 72, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.1 }}>
            Data is how we
            <br />
            prevent the{" "}
            <span style={{ color: "#22D3EE", fontStyle: "italic" }}>next</span> tragedy
          </div>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.65)", maxWidth: 720, lineHeight: 1.6, fontFamily: "sans-serif" }}>
            Tracking 15 priority wellbeing issues facing Australian students — backed by AIHW, Mission Australia, and RoGS 2026 data.
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "48px" }}>
          {[
            { num: "1 in 7", label: "children has a mental disorder" },
            { num: "72%", label: "of conditions begin before 25" },
            { num: "8×", label: "cheaper to intervene early" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: "#FFFFFF", fontFamily: "sans-serif" }}>{s.num}</div>
              <div style={{ fontSize: 16, color: "rgba(255,255,255,0.5)", fontFamily: "sans-serif" }}>{s.label}</div>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{
            display: "flex", alignItems: "center",
            background: "#E05D25", borderRadius: "12px",
            padding: "0 28px", fontSize: 20, fontWeight: 700,
            color: "#FFFFFF", fontFamily: "sans-serif",
          }}>
            nationalcheckinweek.com
          </div>
        </div>
      </div>
    ),
    size
  );
}
