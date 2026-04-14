export type Severity = "critical" | "high" | "notable";

export interface ImpactBox {
  title: string;
  text: string;
}

export interface Issue {
  rank: number;
  slug: string;
  icon: string;
  severity: Severity;
  title: string;
  anchorStat: string;
  shortDesc: string;
  definition: string;
  australianData: string;
  mechanisms: string;
  impacts: ImpactBox[];
  groups: string[];
  sources: string[];
}

export interface RegionalIssue {
  name: string;
  badge: "badge-critical" | "badge-high" | "badge-notable";
  stat: string;
  desc: string;
}

export interface RegionalData {
  subtitle: string;
  issues: RegionalIssue[];
}

export type RegionalMap = Record<string, RegionalData>;
