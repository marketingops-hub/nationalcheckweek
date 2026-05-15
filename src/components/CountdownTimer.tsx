"use client";
import { useEffect, useState } from "react";

const TARGET = new Date("2026-05-25T00:00:00+10:00");

export default function CountdownTimer() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    setMounted(true);
    function tick() {
      const diff = Math.max(0, TARGET.getTime() - Date.now());
      setTime({
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const units = [
    { val: time.days, label: "Days" },
    { val: time.hours, label: "Hours" },
    { val: time.minutes, label: "Mins" },
  ];

  if (!mounted) return <div style={{ height: 88 }} />;

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      {units.map(({ val, label }) => (
        <div key={label} style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.75rem",
            fontWeight: 900,
            color: "#1a1a2e",
            lineHeight: 1,
            background: "#EFF6FF",
            borderRadius: 8,
            padding: "10px 14px",
            minWidth: 54,
            border: "1px solid #DBEAFE",
          }}>
            {String(val).padStart(2, "0")}
          </div>
          <div style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.58rem",
            color: "#6B7280",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginTop: 5,
            fontWeight: 700,
          }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
