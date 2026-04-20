/* ═══════════════════════════════════════════════════════════════════════════
 * Platform constraints for social posts.
 *
 * Hard char limits are taken from each platform's public docs (2025). They are
 * enforced both in the UI (live char counter) and in the generation prompt
 * (the AI is told the limit and asked to stay under it).
 *
 * Adding a new platform: extend SocialPlatform in types.ts, add an entry here,
 * and update the CHECK constraint in the content_drafts migration.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type { SocialPlatform } from './types';

export interface PlatformConfig {
  /** Human-readable label for dropdowns. */
  label: string;
  /** Hard character ceiling. The generator aims for ~90% of this. */
  maxChars: number;
  /** Whether hashtags are idiomatic for this platform. */
  hashtagsOk: boolean;
  /** Suggested hashtag count if `hashtagsOk`. */
  suggestedHashtags: number;
  /** One-line tone guidance fed into the prompt. */
  toneHint: string;
}

export const PLATFORM_CONFIG: Record<SocialPlatform, PlatformConfig> = {
  twitter: {
    label: 'X (Twitter)',
    maxChars: 280,
    hashtagsOk: true,
    suggestedHashtags: 2,
    toneHint: 'punchy, plain-spoken, one idea per post, no filler words',
  },
  linkedin: {
    label: 'LinkedIn',
    maxChars: 3000,
    hashtagsOk: true,
    suggestedHashtags: 3,
    toneHint: 'professional but human, lead with insight, short paragraphs',
  },
  facebook: {
    label: 'Facebook',
    maxChars: 2000,
    hashtagsOk: false,
    suggestedHashtags: 0,
    toneHint: 'conversational, community-focused, invite discussion',
  },
  instagram: {
    label: 'Instagram',
    maxChars: 2200,
    hashtagsOk: true,
    suggestedHashtags: 5,
    toneHint: 'emotive opener, hook in first line, hashtags at the end',
  },
};

/** Safe-target character count for generation (leaves headroom for edits). */
export function targetChars(platform: SocialPlatform): number {
  return Math.floor(PLATFORM_CONFIG[platform].maxChars * 0.9);
}

/** List of all platforms — useful for dropdowns. */
export const SOCIAL_PLATFORMS: SocialPlatform[] = Object.keys(
  PLATFORM_CONFIG,
) as SocialPlatform[];
