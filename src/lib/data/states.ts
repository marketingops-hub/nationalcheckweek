import type { SeverityLevel } from "@/lib/colors";

export interface StateInfo {
  name: string;
  abbr: string;
  slug: string;
  severity: SeverityLevel;
  population: string;
  topIssue: string;
  stat: string;
  issues: number;
  color: string;
}

export const STATES: StateInfo[] = [
  {
    name: "New South Wales",
    abbr: "NSW",
    slug: "new-south-wales",
    severity: "high",
    population: "8.3M",
    topIssue: "Cyberbullying & Anxiety",
    stat: "53% cyberbullied",
    issues: 5,
    color: "#D97706",
  },
  {
    name: "Victoria",
    abbr: "VIC",
    slug: "victoria",
    severity: "high",
    population: "6.7M",
    topIssue: "Depression & Loneliness",
    stat: "1 in 5 teens in distress",
    issues: 4,
    color: "#D97706",
  },
  {
    name: "Queensland",
    abbr: "QLD",
    slug: "queensland",
    severity: "critical",
    population: "5.4M",
    topIssue: "Bullying in Schools",
    stat: "46,000+ incidents (2023)",
    issues: 5,
    color: "#DC2626",
  },
  {
    name: "Western Australia",
    abbr: "WA",
    slug: "western-australia",
    severity: "critical",
    population: "2.9M",
    topIssue: "Remote Attendance Crisis",
    stat: "~57% remote attendance",
    issues: 4,
    color: "#DC2626",
  },
  {
    name: "South Australia",
    abbr: "SA",
    slug: "south-australia",
    severity: "high",
    population: "1.8M",
    topIssue: "Distress & Loneliness",
    stat: "1 in 5 SA teens",
    issues: 4,
    color: "#D97706",
  },
  {
    name: "Tasmania",
    abbr: "TAS",
    slug: "tasmania",
    severity: "high",
    population: "571K",
    topIssue: "Socioeconomic Disadvantage",
    stat: "Lowest SEIFA nationally",
    issues: 4,
    color: "#D97706",
  },
  {
    name: "Northern Territory",
    abbr: "NT",
    slug: "northern-territory",
    severity: "critical",
    population: "251K",
    topIssue: "Attendance & Self-Harm",
    stat: "50–60% remote attendance",
    issues: 4,
    color: "#DC2626",
  },
  {
    name: "Australian Capital Territory",
    abbr: "ACT",
    slug: "australian-capital-territory",
    severity: "notable",
    population: "470K",
    topIssue: "Academic Anxiety",
    stat: "Highest self-reported in Aus.",
    issues: 4,
    color: "#059669",
  },
];

/* Risk bar widths (out of 100) — represents composite concern level */
export const RISK_SCORE: Record<string, number> = {
  "new-south-wales": 72,
  "victoria": 68,
  "queensland": 85,
  "western-australia": 90,
  "south-australia": 65,
  "tasmania": 70,
  "northern-territory": 97,
  "australian-capital-territory": 55,
};

/* Map: state full name → severity level */
export const STATE_SEVERITY: Record<string, SeverityLevel> = {
  "New South Wales":              "high",
  "Victoria":                     "high",
  "Queensland":                   "critical",
  "South Australia":              "high",
  "Western Australia":            "critical",
  "Tasmania":                     "high",
  "Northern Territory":           "critical",
  "Australian Capital Territory": "notable",
};

/* Map: state full name → abbreviation */
export const STATE_ABBR: Record<string, string> = {
  "New South Wales":              "NSW",
  "Victoria":                     "VIC",
  "Queensland":                   "QLD",
  "South Australia":              "SA",
  "Western Australia":            "WA",
  "Tasmania":                     "TAS",
  "Northern Territory":           "NT",
  "Australian Capital Territory": "ACT",
};
