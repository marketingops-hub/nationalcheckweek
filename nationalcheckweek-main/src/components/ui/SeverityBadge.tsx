import { SEVERITY, SEVERITY_ICON, type SeverityLevel } from "@/lib/colors";

interface SeverityBadgeProps {
  severity: SeverityLevel;
  showIcon?: boolean;
}

export default function SeverityBadge({ severity, showIcon = true }: SeverityBadgeProps) {
  const s = SEVERITY[severity];
  return (
    <span
      className="severity-badge"
      style={{ background: s.bgSolid, color: s.text }}
    >
      {showIcon && SEVERITY_ICON[severity]} {s.label}
    </span>
  );
}
