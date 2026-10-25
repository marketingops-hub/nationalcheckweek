import type { EvidenceItem } from "./evidence";

/** True when a change is properly backed: at least one quote, every quote found, no untraceable figure. */
export function isBacked(evidence: EvidenceItem[] | undefined, unsupported: string[] | undefined): boolean {
  const list = evidence ?? [];
  return list.length > 0 && list.every((e) => e.verified) && (unsupported?.length ?? 0) === 0;
}

const same = (a: unknown, b: unknown) => JSON.stringify(norm(a)) === JSON.stringify(norm(b));

function norm(v: unknown): unknown {
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) return v.map(norm);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, norm(x)]));
  return v;
}

/**
 * Sections that have no valid source behind them: unchanged sections (nothing
 * from the documents was used) and changed ones whose evidence is missing,
 * unverified or has untraceable figures.
 */
export function weakFields(
  fields: readonly string[],
  changed: string[],
  evidence: Record<string, EvidenceItem[]>,
  unsupported: Record<string, string[]>,
): string[] {
  return fields.filter((f) => !(changed.includes(f) && isBacked(evidence[f], unsupported[f])));
}

export interface MergeInput {
  fields: readonly string[];
  weak: string[];
  current: Record<string, unknown>;
  /** the first-pass draft */
  draft: Record<string, unknown>;
  evidence: Record<string, EvidenceItem[]>;
  unsupported: Record<string, string[]>;
  /** the second pass: new text for the weak sections it could write, with the checks on that text */
  refilled: Record<string, unknown>;
  refilledEvidence: Record<string, EvidenceItem[]>;
  refilledUnsupported: Record<string, string[]>;
}

export interface MergeResult {
  content: Record<string, unknown>;
  evidence: Record<string, EvidenceItem[]>;
  unsupported: Record<string, string[]>;
  /** sections that were weak and are now backed by a verified quote */
  nowBacked: string[];
  /** sections that stayed weak: the draft is kept, flagged */
  stillWeak: string[];
  /** sections with nothing supporting a change: left exactly as they are on the live page */
  keptCurrent: string[];
}

/**
 * Combine the first draft with the second pass, one weak section at a time:
 *  - the second pass is backed by sources       -> use it, with its evidence;
 *  - otherwise, the first pass had changed it   -> keep that draft, still flagged;
 *  - otherwise (it was unchanged)               -> leave the live text alone.
 * A section that is already backed is never touched.
 */
export function mergeRefill(input: MergeInput): MergeResult {
  const content = { ...input.draft };
  const evidence = { ...input.evidence };
  const unsupported = { ...input.unsupported };
  const nowBacked: string[] = [];
  const stillWeak: string[] = [];
  const keptCurrent: string[] = [];

  for (const f of input.weak) {
    const candidate = f in input.refilled ? input.refilled[f] : undefined;
    const candidateChanged = candidate !== undefined && !same(candidate, input.current[f]);
    if (candidateChanged && isBacked(input.refilledEvidence[f], input.refilledUnsupported[f])) {
      content[f] = candidate;
      evidence[f] = input.refilledEvidence[f];
      delete unsupported[f];
      nowBacked.push(f);
    } else if (!same(input.draft[f], input.current[f])) {
      stillWeak.push(f); // first-pass change without valid backing: keep, flagged
    } else {
      content[f] = input.current[f];
      delete evidence[f];
      delete unsupported[f];
      keptCurrent.push(f);
    }
  }
  return { content, evidence, unsupported, nowBacked, stillWeak, keptCurrent };
}
