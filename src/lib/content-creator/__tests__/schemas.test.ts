import { describe, it, expect } from 'vitest';
import {
  GenerateIdeasSchema,
  ContentDraftPatchSchema,
  canTransition,
  ALLOWED_TRANSITIONS,
} from '../schemas';

describe('GenerateIdeasSchema', () => {
  it('accepts a minimal blog brief', () => {
    const r = GenerateIdeasSchema.safeParse({
      content_type: 'blog',
      brief: { topic: 'Student wellbeing in secondary schools' },
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.count).toBe(5); // default
  });

  it('requires platform when content_type is social', () => {
    const r = GenerateIdeasSchema.safeParse({
      content_type: 'social',
      brief: { topic: 'Check-ins catch issues early' },
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.join('.') === 'platform')).toBe(true);
    }
  });

  it('rejects platform for blog posts', () => {
    const r = GenerateIdeasSchema.safeParse({
      content_type: 'blog',
      platform: 'twitter',
      brief: { topic: 'Topic here' },
    });
    expect(r.success).toBe(false);
  });

  it('rejects an empty topic', () => {
    const r = GenerateIdeasSchema.safeParse({
      content_type: 'blog',
      brief: { topic: 'ab' }, // < 3 chars
    });
    expect(r.success).toBe(false);
  });

  it('clamps count via schema (max 10)', () => {
    const r = GenerateIdeasSchema.safeParse({
      content_type: 'blog',
      brief: { topic: 'Valid topic' },
      count: 99,
    });
    expect(r.success).toBe(false);
  });
});

describe('ContentDraftPatchSchema', () => {
  it('allows body-only patches', () => {
    const r = ContentDraftPatchSchema.safeParse({ body: 'new body' });
    expect(r.success).toBe(true);
  });

  it('allows null title (for social posts)', () => {
    const r = ContentDraftPatchSchema.safeParse({ title: null });
    expect(r.success).toBe(true);
  });

  it('rejects absurdly long bodies', () => {
    const r = ContentDraftPatchSchema.safeParse({ body: 'x'.repeat(50_001) });
    expect(r.success).toBe(false);
  });
});

describe('status transition graph', () => {
  it('allows idea → approved_idea', () => {
    expect(canTransition('idea', 'approved_idea')).toBe(true);
  });

  it('blocks idea → verified (must go through all stages)', () => {
    expect(canTransition('idea', 'verified')).toBe(false);
  });

  it('allows verified → draft (unlock path)', () => {
    expect(canTransition('verified', 'draft')).toBe(true);
  });

  it('allows rejected → draft for fix-and-retry', () => {
    expect(canTransition('rejected', 'draft')).toBe(true);
  });

  it('archived is a terminal state', () => {
    expect(ALLOWED_TRANSITIONS.archived).toEqual([]);
    expect(canTransition('archived', 'draft')).toBe(false);
  });

  it('allows unapprove (approved_idea → idea)', () => {
    expect(canTransition('approved_idea', 'idea')).toBe(true);
  });

  it('blocks unapprove once content is generated (draft → idea)', () => {
    expect(canTransition('draft', 'idea')).toBe(false);
  });
});
