import areasData from "./data/areas.json";

export interface AreaIssue {
  title: string;
  severity: "critical" | "high" | "notable";
  stat: string;
  desc: string;
}

export interface AreaSource {
  title: string;
  url: string;
  publisher: string;
  year: string;
  type: "web" | "report" | "data" | "research";
}

export interface Area {
  slug: string;
  name: string;
  state: string;
  stateSlug: string;
  type: "city" | "region" | "lga";
  population: string;
  schools: string;
  overview: string;
  keyStats: { num: string; label: string }[];
  issues: AreaIssue[];
  prevention: string;
  sources?: AreaSource[];
}

export const AREAS: Area[] = areasData as Area[];

export function getAreaBySlug(slug: string): Area | undefined {
  return AREAS.find(a => a.slug === slug);
}

export function getAreasByState(stateSlug: string): Area[] {
  return AREAS.filter(a => a.stateSlug === stateSlug);
}
