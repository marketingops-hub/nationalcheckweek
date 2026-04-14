export type SeverityLevel = "critical" | "high" | "notable";

export interface SeverityConfig {
  color: string;
  hover: string;
  bg: string;
  border: string;
  label: string;
  bgSolid: string;
  text: string;
}

export const SEVERITY: Record<SeverityLevel, SeverityConfig> = {
  critical: { color: "#DC2626", hover: "#B91C1C", bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.25)", label: "Critical", bgSolid: "#FEE2E2", text: "#B91C1C" },
  high:     { color: "#D97706", hover: "#B45309", bg: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.25)", label: "Elevated", bgSolid: "#FEF3C7", text: "#B45309" },
  notable:  { color: "#059669", hover: "#047857", bg: "rgba(5,150,105,0.08)", border: "rgba(5,150,105,0.25)", label: "Notable",  bgSolid: "#D1FAE5", text: "#15803D" },
};

export const SEVERITY_ICON: Record<SeverityLevel, string> = {
  critical: "⚠",
  high: "↑",
  notable: "●",
};

export const SEVERITY_LABEL: Record<SeverityLevel, string> = {
  critical: "⚠ Critical",
  high: "↑ Elevated",
  notable: "● Notable",
};
