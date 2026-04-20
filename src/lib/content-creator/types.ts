/* ═══════════════════════════════════════════════════════════════════════════
 * Shared types for the Content Creator pipeline.
 *
 * These mirror the `content_drafts` table (see supabase/migrations/
 * 20260420000001_content_drafts.sql) and the JSON shapes produced by the
 * edge function. Keep them in sync when either end changes.
 * ═══════════════════════════════════════════════════════════════════════════ */

export type ContentType = 'social' | 'blog' | 'newsletter';

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
}

/**
 * Everything we record about the AI chain for a given draft.
 * Used for cost analysis, debugging, and the fallback-used dashboard.
 */
export interface AIMetadata {
  openai_model?: string;
  anthropic_model?: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  provider?: 'openai' | 'anthropic';
  fallback_used?: boolean;
  generated_at?: string;
  verified_at?: string;
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

/* ─── Edge function request/response shapes ─────────────────────────────── */

export type EdgeStage = 'generate_ideas' | 'generate' | 'verify';

export interface GenerateIdeasRequest {
  stage: 'generate_ideas';
  content_type: ContentType;
  platform?: SocialPlatform;
  brief: ContentBrief;
  count?: number;  // default 5
}

export interface GenerateIdeasResponse {
  ideas: Array<{ id: string; title: string; summary: string }>;  // inserted draft rows
}

export interface GenerateRequest {
  stage: 'generate';
  draft_id: string;
}

export interface GenerateResponse {
  draft: ContentDraft;
}

export interface VerifyRequest {
  stage: 'verify';
  draft_id: string;
}

export interface VerifyResponse {
  draft: ContentDraft;
  verification: VerificationResult;
}

/** Convenience type for any edge fn payload. */
export type EdgeRequest = GenerateIdeasRequest | GenerateRequest | VerifyRequest;
