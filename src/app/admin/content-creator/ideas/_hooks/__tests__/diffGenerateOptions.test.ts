/* ═══════════════════════════════════════════════════════════════════════════
 * Unit tests for the `diffGenerateOptions` helper.
 *
 * This helper decides what (if anything) to PATCH before firing the
 * generate edge fn. The logic looks simple but the branches matter —
 * shipping a no-op PATCH spams the audit log, shipping an over-broad
 * PATCH clobbers admin intent, and failing to send `style_id: null`
 * leaves a stale style on the brief which the edge fn then has to
 * work around. Each of those outcomes has a test below.
 *
 * We construct minimal stubs of ContentDraft rather than importing a
 * fixture — the helper only reads `content_type`, `platform`, `brief`,
 * and uses a Pick<> in its signature that makes the surface obvious.
 * ═══════════════════════════════════════════════════════════════════════════ */

import { describe, it, expect } from 'vitest';
import { diffGenerateOptions } from '../useIdeasList';
import type { ContentDraft, ContentBrief } from '@/lib/content-creator/types';

/** Tiny factory — saves the noise of fully-typed draft shapes. */
function draft(partial: {
  content_type?: ContentDraft['content_type'];
  platform?:     ContentDraft['platform'];
  brief?:        Partial<ContentBrief>;
}): Pick<ContentDraft, 'content_type' | 'platform' | 'brief'> {
  return {
    content_type: partial.content_type ?? 'blog',
    platform:     partial.platform     ?? null,
    brief:        { topic: 'Stub topic', ...(partial.brief ?? {}) } as ContentBrief,
  };
}

describe('diffGenerateOptions — no-op detection', () => {
  it('returns null when every option equals the current draft', () => {
    const current = draft({
      content_type: 'blog',
      brief: { topic: 't', style_id: 'abc', length_preset: 'standard' },
    });
    expect(
      diffGenerateOptions(current, {
        content_type:  'blog',
        platform:      null,
        length_preset: 'standard',
        style_id:      'abc',
      }),
    ).toBeNull();
  });

  it('treats missing length_preset on the draft as "standard"', () => {
    const current = draft({ content_type: 'blog', brief: { topic: 't' } });
    // Admin picks "standard" — nothing to patch because missing==standard.
    expect(
      diffGenerateOptions(current, {
        content_type:  'blog',
        platform:      null,
        length_preset: 'standard',
        style_id:      null,
      }),
    ).toBeNull();
  });

  it('treats missing platform on the draft as equivalent to null', () => {
    const current = draft({ content_type: 'blog', platform: null });
    expect(
      diffGenerateOptions(current, {
        content_type:  'blog',
        platform:      null,
        length_preset: 'standard',
        style_id:      null,
      }),
    ).toBeNull();
  });
});

describe('diffGenerateOptions — content_type + platform', () => {
  it('patches content_type when it changes', () => {
    const current = draft({ content_type: 'blog' });
    const patch = diffGenerateOptions(current, {
      content_type:  'newsletter',
      platform:      null,
      length_preset: 'standard',
      style_id:      null,
    });
    expect(patch).toEqual({ content_type: 'newsletter' });
  });

  it('patches platform on social-type switch', () => {
    const current = draft({ content_type: 'blog', platform: null });
    const patch = diffGenerateOptions(current, {
      content_type:  'social',
      platform:      'linkedin',
      length_preset: 'standard',
      style_id:      null,
    });
    expect(patch).toEqual({
      content_type: 'social',
      platform:     'linkedin',
    });
  });

  it('patches platform alone when content_type is already social', () => {
    const current = draft({ content_type: 'social', platform: 'twitter' });
    const patch = diffGenerateOptions(current, {
      content_type:  'social',
      platform:      'linkedin',
      length_preset: 'standard',
      style_id:      null,
    });
    expect(patch).toEqual({ platform: 'linkedin' });
  });
});

describe('diffGenerateOptions — style clearing (null path)', () => {
  it('sends style_id: null when the admin clears a previously-set style', () => {
    const current = draft({ brief: { topic: 't', style_id: 'old-style-uuid' } });
    const patch = diffGenerateOptions(current, {
      content_type:  'blog',
      platform:      null,
      length_preset: 'standard',
      style_id:      null,
    });
    // Must actually carry the null so the PATCH route deletes the key.
    expect(patch).toEqual({ brief_patch: { style_id: null } });
  });

  it('does NOT send a style_id patch when both are already null/absent', () => {
    const current = draft({ brief: { topic: 't' } });
    const patch = diffGenerateOptions(current, {
      content_type:  'blog',
      platform:      null,
      length_preset: 'standard',
      style_id:      null,
    });
    // Missing ≡ null on both sides → no diff.
    expect(patch).toBeNull();
  });

  it('sends style_id when picking a style for the first time', () => {
    const current = draft({ brief: { topic: 't' } });
    const patch = diffGenerateOptions(current, {
      content_type:  'blog',
      platform:      null,
      length_preset: 'standard',
      style_id:      'new-style-uuid',
    });
    expect(patch).toEqual({ brief_patch: { style_id: 'new-style-uuid' } });
  });

  it('sends both old + new style_id change as a single key (no duplicate writes)', () => {
    const current = draft({ brief: { topic: 't', style_id: 'old' } });
    const patch = diffGenerateOptions(current, {
      content_type:  'blog',
      platform:      null,
      length_preset: 'standard',
      style_id:      'new',
    });
    expect(patch).toEqual({ brief_patch: { style_id: 'new' } });
  });
});

describe('diffGenerateOptions — length_preset', () => {
  it('patches length_preset when it changes', () => {
    const current = draft({ brief: { topic: 't', length_preset: 'standard' } });
    const patch = diffGenerateOptions(current, {
      content_type:  'blog',
      platform:      null,
      length_preset: 'long',
      style_id:      null,
    });
    expect(patch).toEqual({ brief_patch: { length_preset: 'long' } });
  });

  it('combines content_type and length_preset into one PATCH', () => {
    const current = draft({ content_type: 'blog', brief: { topic: 't' } });
    const patch = diffGenerateOptions(current, {
      content_type:  'newsletter',
      platform:      null,
      length_preset: 'short',
      style_id:      null,
    });
    expect(patch).toEqual({
      content_type: 'newsletter',
      brief_patch:  { length_preset: 'short' },
    });
  });
});

describe('diffGenerateOptions — compound diffs', () => {
  it('sends type + platform + style + length in one PATCH', () => {
    const current = draft({
      content_type: 'blog',
      platform: null,
      brief: { topic: 't', style_id: 'old', length_preset: 'standard' },
    });
    const patch = diffGenerateOptions(current, {
      content_type:  'social',
      platform:      'linkedin',
      length_preset: 'long',
      style_id:      'new',
    });
    expect(patch).toEqual({
      content_type: 'social',
      platform:     'linkedin',
      brief_patch:  { style_id: 'new', length_preset: 'long' },
    });
  });

  it('never includes an empty brief_patch key', () => {
    // Only top-level fields differ. brief_patch must be absent, not {}.
    const current = draft({ content_type: 'blog' });
    const patch = diffGenerateOptions(current, {
      content_type:  'newsletter',
      platform:      null,
      length_preset: 'standard',
      style_id:      null,
    });
    expect(patch).not.toHaveProperty('brief_patch');
    expect(patch).toEqual({ content_type: 'newsletter' });
  });
});
