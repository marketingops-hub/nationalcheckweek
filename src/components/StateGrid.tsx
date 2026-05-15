"use client";
import { useState } from "react";
import Link from "next/link";
import { SEVERITY } from "@/lib/colors";
import { STATES, RISK_SCORE } from "@/lib/data/states";

export default function StateGrid() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div>
      {/* Legend */}
      <div className="sg-legend">
        {(["critical", "high", "notable"] as const).map(sev => (
          <div key={sev} className="sg-legend__item">
            <div className="sg-legend__dot" style={{ background: SEVERITY[sev].color }} />
            <span className="sg-legend__label">{SEVERITY[sev].label} concern</span>
          </div>
        ))}
      </div>

      {/* State cards grid */}
      <div className="sg-grid">
        {STATES.map(s => {
          const isHovered = hovered === s.slug;
          const sev = SEVERITY[s.severity];
          const score = RISK_SCORE[s.slug];
          return (
            <Link
              key={s.slug}
              href={`/states/${s.slug}`}
              className="sg-card-link"
              onMouseEnter={() => setHovered(s.slug)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className="sg-card"
                style={{
                  background: isHovered ? sev.bg : undefined,
                  borderColor: isHovered ? s.color : undefined,
                  borderLeft: `5px solid ${s.color}`,
                  boxShadow: isHovered ? `0 8px 24px ${sev.border}` : undefined,
                }}
              >
                {/* Header row */}
                <div className="sg-card__header">
                  <div>
                    <div className="sg-card__abbr" style={{ color: s.color }}>{s.abbr}</div>
                    <div className="sg-card__name">{s.name}</div>
                  </div>
                  <span
                    className="sg-card__badge"
                    style={{ background: sev.bg, color: s.color, border: `1px solid ${sev.border}` }}
                  >
                    {sev.label}
                  </span>
                </div>

                {/* Top issue */}
                <div className="sg-card__section">
                  <div className="sg-card__eyebrow">Top concern</div>
                  <div className="sg-card__issue">{s.topIssue}</div>
                  <div className="sg-card__stat" style={{ color: s.color }}>{s.stat}</div>
                </div>

                {/* Risk bar */}
                <div className="sg-card__section">
                  <div className="sg-risk-header">
                    <span className="sg-risk-label">Concern level</span>
                    <span className="sg-risk-score" style={{ color: s.color }}>{score}/100</span>
                  </div>
                  <div className="sg-risk-bar">
                    <div className="sg-risk-bar__fill" style={{ width: `${score}%`, background: s.color }} />
                  </div>
                </div>

                {/* Footer */}
                <div className="sg-card__footer">
                  <span className="sg-card__meta">{s.issues} priority issues · pop. {s.population}</span>
                  <span className="sg-card__cta" style={{ color: s.color }}>
                    {isHovered ? "View →" : "Explore →"}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Comparative bar chart */}
      <div className="sg-barchart">
        <div className="sg-barchart__title">
          Composite wellbeing concern score by state / territory
        </div>
        <div className="sg-barchart__list">
          {[...STATES].sort((a, b) => RISK_SCORE[b.slug] - RISK_SCORE[a.slug]).map(s => (
            <Link key={`bar-${s.slug}`} href={`/states/${s.slug}`} className="sg-barchart__row">
              <div className="sg-barchart__abbr" style={{ color: s.color }}>{s.abbr}</div>
              <div className="sg-barchart__track">
                <div
                  className="sg-barchart__fill"
                  style={{
                    width: `${RISK_SCORE[s.slug]}%`,
                    background: `linear-gradient(90deg, ${s.color}cc, ${s.color})`,
                  }}
                >
                  <span className="sg-barchart__fill-label">{s.topIssue}</span>
                </div>
              </div>
              <div className="sg-barchart__val" style={{ color: s.color }}>{RISK_SCORE[s.slug]}</div>
            </Link>
          ))}
        </div>
        <div className="sg-barchart__note">
          Composite score based on severity of documented issues, coverage in national data sources (AIHW, Mission Australia, RoGS 2026), and prevalence rates. Click any bar to explore state detail.
        </div>
      </div>
    </div>
  );
}
