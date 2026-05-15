/* ═══════════════════════════════════════════════════════════════════════════
 * Shared types for the Content Creator pipeline.
 *
 * These mirror the `content_drafts` table (see supabase/migrations/
 * 20260420000001_content_drafts.sql) and the JSON shapes produced by the
 * edge function. Keep them in sync when either end changes.
 * ═══════════════════════════════════════════════════════════════════════════ */

/** `geo` = area×issue landing page, rendered via the CMS Pages module
 *  with `cms_pages.category = 'geo'`. Shares the long-form pipeline with
 *  blog / newsletter but skips the ideas stage (the area+issue pair IS
 *  the topic). */
export type ContentType = 'social' | 'blog' | 'newsletter' | 'geo';

export type SocialPlatform = 'twitter' | 'linkedin' | 'facebook' | 'instagram';

/**
 * Pipeline stages. The DB enforces these as a CHECK constraint; do not add
 * new values here without also updating the migration.
 */
export type ContentStatus =
  | 'idea'           // stage 1 output, awaiting approval
  | 'approved_idea'  // user approved, ready to generate
  | 'generating'    // OpenAI → Anthropic chain in flight
  | 'draft'          // content written, awaiting verification
  | 'verifying'     // verification chain in flight
  | 'verified'       // all claims vault-backed, team-ready
  | 'rejected'       // flagged claims, back to editor
  | 'archived';      // soft-deleted

/**
 * Original user input that kicks off the pipeline.
 * Stored verbatim in content_drafts.brief so stages 2 + 3 have full context.
 */
export interface ContentBrief {
  topic: string;
  tone?: string;                 // e.g. "evidence-based", "conversational"
  audience?: string;             // e.g. "school principals", "parents"
  keywords?: string[];
  /** Filters vault_content.category during RAG. Optional — if absent, all categories are fair game. */
  vault_category?: string;
  /** When the brief was spawned from a content_topics row, track it here. */
  source_topic_id?: string;
  /**
   * Optional reference to a content_writing_styles row. When set, the
   * edge functions fetch that style's `prompt` field and prepend it to
   * the system message so the AI adopts the chosen voice. Null is
   * accepted (distinct from undefined) so PATCH payloads can explicitly
   * clear a previously-set style — the route handler treats null as
   * "unset this field" when merging brief_patch.
   */
  style_id?: string | null;
  /**
   * For long-form only (blog / newsletter). When explicitly false the
   * generate stage is instructed to omit the title, and the PATCH route
   * allows `title` to be null regardless of content_type. Undefined is
   * treated as true so existing drafts keep their title behaviour.
   */
  include_title?: boolean;
  /**
   * Captured from the "Request improvement" feedback box on the draft
   * detail page. The next generate pass reads this, injects it into the
   * user prompt, and clears it on success.
   */
  regeneration_feedback?: string;
  /**
   * Optional length hint surfaced to the admin at generate time (see the
   * "Generate options" modal). Widens or tightens the word range the
   * generate prompt asks the model to hit. Undefined = the baseline range
   * for the content_type. Social posts ignore this field (their length is
   * driven by platform char limits).
   */
  length_preset?: 'short' | 'standard' | 'long';
  /**
   * GEO-page only. Both required when `content_type === 'geo'`.
   *   - `area_slug`  matches areas.slug (e.g. "wagga-wagga").
   *   - `issue_slug` matches issues.slug (e.g. "bullying").
   * The edge fn resolves these to the full area row + issue row on the
   * server and injects the area's `issues` JSON into the user prompt for
   * local context. Stored as slugs (not UUIDs) so the draft stays readable
   * in the DB and the publish step can build the page slug directly.
   */
  area_slug?: string;
  issue_slug?: string;
}

/**
 * Everything we record about the AI chain for a given draft.
 * Used for cost analysis, debugging, and the fallback-used dashboard.
 *
 * Declared as a loose bag because each stage (topics/ideas/generate/verify)
 * adds its own extras (drift_warnings, seed, last_error, verification_tokens,
 * hallucinated_vault_ids, etc). The "known" keys are documented; anything
 * else is allowed without tripping TS.
 */
export interface AIMetadata {
  /* ── identity of the models + token usage ── */
  openai_model?:    string;
  anthropic_model?: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  verification_tokens?: { prompt: number; completion: number; total: number };
  provider?: 'openai' | 'anthropic';

  /* ── lifecycle timestamps ── */
  generated_at?: string;
  verified_at?:  string;

  /* ── failure + degradation signals ── */
  fallback_used?:    boolean;         // true when Anthropic improve was skipped
  drift_warnings?:   string[];        // improve-pass complaints
  last_error?:            string;
  last_error_at?:         string;
  last_error_stage?:      'generate' | 'verify' | 'topics' | 'ideas';
  /** Request id (10 hex chars) tagged onto the failing run by the edge
   *  fn's createLogger. Admins paste this into Supabase log search to
   *  trace the upstream cause of a failure. */
  last_error_request_id?: string;
  /** Request id of the last successful run. Same provenance as above —
   *  useful for eyeballing slow runs on the Provenance card. */
  request_id?:            string;

  /* ── topic-stage only ── */
  seed?: string | null;

  /* ── escape hatch: stage-specific fields we don't want to enumerate ── */
  [key: string]: unknown;
}

/** One factual claim the verifier has cross-checked against the vault. */
export interface SupportedClaim {
  claim: string;
  vault_id: string;     // vault_content.id
  source?: string;      // vault_sources.url (denormalised for UI)
}

/** A claim the verifier could NOT trace to a vault entry. */
export interface FlaggedClaim {
  claim: string;
  reason: string;
  suggested_fix?: string;
}

export interface VerificationResult {
  status: 'verified' | 'partially_verified' | 'unverified';
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
  supported_claims: SupportedClaim[];
  flagged_claims: FlaggedClaim[];
  checked_at: string;
  /** Human sign-off (set by the /finalize endpoint). Row stays in
   *  status='verified' — these two flags are what the UI treats as the
   *  "ready to publish" signal. */
  approved_at?: string;
  approved_by?: string | null;
}

/**
 * The canonical draft shape. Mirrors the content_drafts row 1:1.
 * `title` is nullable because social posts never have one (DB CHECK enforces).
 */
export interface ContentDraft {
  id: string;
  content_type: ContentType;
  platform: SocialPlatform | null;
  status: ContentStatus;
  title: string | null;
  body: string;
  brief: ContentBrief;
  ai_metadata: AIMetadata;
  verification: Partial<VerificationResult>;
  vault_refs: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

/* ─── Edge function response shapes ─────────────────────────────────────────
 * Requests are validated by Zod schemas in `./schemas.ts` and `./topics.ts`.
 * Responses are what each `content-creator-*` edge fn returns on 200.
 * ────────────────────────────────────────────────────────────────────────── */

export interface GenerateIdeasResponse {
  /** New draft rows inserted with status='idea'. */
  ideas: ContentDraft[];
}

export interface GenerateResponse {
  draft: ContentDraft;
}

export interface VerifyResponse {
  draft:        ContentDraft;
  verification: VerificationResult;
}
