import { z } from 'zod';
import { NextResponse } from 'next/server';

// ─── Reusable primitives ──────────────────────────────────────────────────────

const optStr = z.string().optional();
const optNullStr = z.string().nullable().optional();
const optBool = z.boolean().optional();
const optNum = z.number().optional();

// Transform empty strings to null — prevents PostgreSQL date/timestamp parse failures
const emptyToNull = z.string().transform((v) => v.trim() === '' ? null : v).nullable().optional();

// ─── Blog ─────────────────────────────────────────────────────────────────────

export const BlogPatchSchema = z.object({
  title:         optStr,
  slug:          optStr,
  excerpt:       optNullStr,
  content:       optNullStr,
  feature_image: optNullStr,
  author:        optNullStr,
  published:     optBool,
  published_at:  emptyToNull,
  meta_title:    optNullStr,
  meta_desc:     optNullStr,
  og_image:      optNullStr,
});

// ─── Events ───────────────────────────────────────────────────────────────────

const SpeakerSchema = z.object({
  name:       z.string(),
  title:      z.string().optional(),
  bio:        z.string().optional(),
  photo:      z.string().optional(),
  sort_order: z.number().optional(),
}).passthrough();

export const EventPutSchema = z.object({
  slug:              z.string().min(1),
  title:             z.string().min(1),
  tagline:           optStr,
  description:       optStr,
  body:              optStr,
  event_date:        emptyToNull,
  event_time:        optStr,
  event_end:         optStr,
  format:            z.enum(['webinar','in-person','hybrid','workshop','conference']).optional(),
  location:          optStr,
  feature_image:     optNullStr,
  is_free:           optBool,
  price:             optStr,
  register_url:      optStr,
  recording_url:     optStr,
  hubspot_form_id:   optStr,
  hubspot_portal_id: optStr,
  status:            z.enum(['draft','upcoming','live','past','cancelled']).optional(),
  published:         optBool,
  seo_title:         optStr,
  seo_desc:          optStr,
  speakers:          z.array(SpeakerSchema).optional(),
});

// ─── Ambassadors ──────────────────────────────────────────────────────────────

export const AmbassadorPatchSchema = z.object({
  name:        optStr,
  title:       optNullStr,
  bio:         optNullStr,
  photoUrl:    optNullStr,
  slug:        optStr,
  sortOrder:   optNum,
  active:      optBool,
  linkedinUrl: optNullStr,
  websiteUrl:  optNullStr,
  categoryId:  optNullStr,
  comment:     optNullStr,
  event_link:  optNullStr,
});

export const AmbassadorCategoryPatchSchema = z.object({
  name:        optStr,
  slug:        optStr,
  description: optStr,
  color:       optStr,
  icon:        optStr,
  sort_order:  optNum,
});

export const AmbassadorCategoryPostSchema = z.object({
  name:        z.string().min(1),
  slug:        z.string().min(1),
  description: z.string().optional().default(''),
  color:       z.string().optional().default('#7c3aed'),
  icon:        z.string().optional().default('diversity_3'),
  sort_order:  z.number().optional().default(0),
});

// ─── CMS Pages ────────────────────────────────────────────────────────────────

export const CmsPagePatchSchema = z.object({
  title:            optStr,
  slug:             optStr,
  meta_description: optNullStr,
  content:          optNullStr,
  published:        optBool,
  og_image:         optNullStr,
});

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export const FaqPatchSchema = z.object({
  question:  optStr,
  answer:    optStr,
  category:  optNullStr,
  sortOrder: optNum,
  active:    optBool,
});

// ─── Partners ─────────────────────────────────────────────────────────────────

export const PartnerPatchSchema = z.object({
  name:        optStr,
  description: optNullStr,
  logoUrl:     optNullStr,
  url:         optNullStr,
  slug:        optStr,
  sortOrder:   optNum,
  active:      optBool,
});

export const PartnerPostSchema = z.object({
  name:        z.string().min(1),
  slug:        z.string().min(1),
  description: z.string().nullable().optional(),
  logoUrl:     z.string().nullable().optional(),
  url:         z.string().nullable().optional(),
  sortOrder:   z.number().optional().default(0),
  active:      z.boolean().optional().default(true),
});

// ─── Resources ────────────────────────────────────────────────────────────────

export const ResourcePatchSchema = z.object({
  name:         optStr,
  description:  optNullStr,
  content:      optNullStr,
  thumbnailUrl: optNullStr,
  url:          optNullStr,
  slug:         optStr,
  category:     optNullStr,
  sortOrder:    optNum,
  active:       optBool,
});

export const ResourcePostSchema = z.object({
  name:         z.string().min(1),
  slug:         z.string().min(1),
  description:  z.string().nullable().optional(),
  content:      z.string().nullable().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  url:          z.string().nullable().optional(),
  category:     z.string().nullable().optional(),
  sortOrder:    z.number().optional().default(0),
  active:       z.boolean().optional().default(true),
});

// ─── Submissions ──────────────────────────────────────────────────────────────

export const SubmissionPatchSchema = z.object({
  status:      z.enum(['pending', 'approved', 'rejected', 'reviewed']).optional(),
  notes:       optNullStr,
  reviewed_at: emptyToNull,
  reviewed_by: optNullStr,
});

// ─── Home Page — Hero ─────────────────────────────────────────────────────────

export const HeroPatchSchema = z.object({
  headline:            optStr,
  subheadline:         optNullStr,
  cta_text:            optNullStr,
  cta_url:             optNullStr,
  secondary_cta_text:  optNullStr,
  secondary_cta_url:   optNullStr,
  image_url:           optNullStr,
  video_url:           optNullStr,
  background_color:    optNullStr,
});

// ─── Home Page — CTA ─────────────────────────────────────────────────────────

export const CtaPatchSchema = z.object({
  headline:          optStr,
  subtext:           optNullStr,
  primary_cta_text:  optNullStr,
  primary_cta_url:   optNullStr,
  secondary_cta_text: optNullStr,
  secondary_cta_url:  optNullStr,
  background_color:  optNullStr,
  text_color:        optNullStr,
});

// ─── Home Page — Footer ───────────────────────────────────────────────────────

export const FooterPatchSchema = z.object({
  copyright_text:        optStr,
  tagline:               optNullStr,
  show_social_links:     optBool,
  show_newsletter:       optBool,
  newsletter_title:      optNullStr,
  newsletter_placeholder: optNullStr,
});

// ─── Home Page — Logos ────────────────────────────────────────────────────────

export const LogoPostSchema = z.object({
  name:          z.string().min(1),
  logo_url:      z.string().min(1),
  website_url:   z.string().nullable().optional(),
  alt_text:      z.string().nullable().optional(),
  display_order: z.number().optional().default(0),
  is_active:     z.boolean().optional().default(true),
});

export const LogoPatchSchema = z.object({
  name:          optStr,
  logo_url:      optStr,
  website_url:   optNullStr,
  alt_text:      optNullStr,
  display_order: optNum,
  is_active:     optBool,
});

// ─── Homepage Blocks ─────────────────────────────────────────────────────────

export const HomepageBlockPatchSchema = z.object({
  title:         optStr,
  content:       z.record(z.string(), z.unknown()).optional(),
  display_order: optNum,
  is_visible:    optBool,
});

// ─── Register Page ───────────────────────────────────────────────────────────

export const RegisterPagePatchSchema = z.object({
  heading:               optStr,
  subheading:            optNullStr,
  description:           optNullStr,
  right_column_content:  optNullStr,
  hubspot_form_id:       optNullStr,
  hubspot_portal_id:     optNullStr,
  seo_title:             optNullStr,
  seo_description:       optNullStr,
  background_color:      optNullStr,
});

// ─── Users ───────────────────────────────────────────────────────────────────

export const UserPatchSchema = z.union([
  z.object({ send_reset: z.literal(true), email: z.string().email() }),
  z.object({
    email:    z.string().email().optional(),
    password: z.string().min(8).optional(),
  }),
]);

// ─── Settings (site_settings) ────────────────────────────────────────────────

export const SettingsPatchSchema = z.record(z.string(), z.string());

// ─── Blog Post Create (full validation with constraints) ────────────────────

export const blogPostCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  excerpt: z.string().max(500, 'Excerpt too long').optional(),
  content: z.string().max(100000, 'Content too long').optional(),
  author: z.string().max(100, 'Author name too long').optional(),
  feature_image: z.string().url('Invalid image URL').optional().or(z.literal('')),
  published: z.boolean().default(false),
  meta_title: z.string().max(60, 'Meta title too long').optional(),
  meta_desc: z.string().max(160, 'Meta description too long').optional(),
  og_image: z.string().url('Invalid OG image URL').optional().or(z.literal('')),
});

export const blogPostUpdateSchema = blogPostCreateSchema.partial();

export type BlogPostCreate = z.infer<typeof blogPostCreateSchema>;
export type BlogPostUpdate = z.infer<typeof blogPostUpdateSchema>;

// ─── Area Generation ────────────────────────────────────────────────────────

export const areaGenerateSchema = z.object({
  name: z.string().min(1, 'Area name is required').max(100, 'Name too long'),
  state: z.string().min(1, 'State is required').max(50, 'State too long'),
  type: z.enum(['city', 'region', 'lga']).default('city'),
});

export type AreaGenerate = z.infer<typeof areaGenerateSchema>;

// ─── Blog Generation ────────────────────────────────────────────────────────

export const blogGenerateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  style: z.enum(['professional', 'conversational', 'academic', 'storytelling']).default('professional'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
});

export type BlogGenerate = z.infer<typeof blogGenerateSchema>;

// ─── Sources ────────────────────────────────────────────────────────────────

export const sourceCreateSchema = z.object({
  url: z
    .string()
    .min(1, 'URL is required')
    .url('Must be a valid URL')
    .refine(
      (url) => {
        const urlObj = new URL(url);
        return urlObj.pathname !== '/' || urlObj.hash !== '';
      },
      { message: 'Please provide a specific page URL, not just the homepage' }
    ),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.enum(['mental_health', 'research', 'government', 'general']),
});

export const sourceLinkCreateSchema = z.object({
  sourceId: z.string().uuid('Invalid source ID'),
  entityType: z.enum(['area', 'state', 'issue', 'content', 'research_theme']),
  entitySlug: z.string().min(1, 'Entity slug is required'),
  relevance: z.enum(['primary', 'supporting', 'reference']),
  notes: z.string().max(500, 'Notes too long').optional(),
});

export type SourceCreate = z.infer<typeof sourceCreateSchema>;
export type SourceLinkCreate = z.infer<typeof sourceLinkCreateSchema>;

// ─── API Keys ───────────────────────────────────────────────────────────────

export const apiKeyCreateSchema = z.object({
  label: z
    .string()
    .min(1, 'Label is required')
    .max(100, 'Label too long')
    .regex(/^[a-zA-Z0-9\s-_]+$/, 'Label can only contain letters, numbers, spaces, hyphens, and underscores'),
  provider: z.enum(['openai', 'anthropic', 'google', 'firecrawl', 'other']),
  keyValue: z
    .string()
    .min(8, 'API key seems too short - please check it')
    .max(500, 'API key too long')
    .refine((key) => !key.includes(' '), { message: 'API key should not contain spaces' }),
});

export type ApiKeyCreate = z.infer<typeof apiKeyCreateSchema>;

// ─── Contact / Registration ─────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(254, 'Email too long');

export const registrationSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: emailSchema,
  school: z.string().min(1, 'School name is required').max(200, 'School name too long').optional(),
  role: z.string().max(100, 'Role too long').optional(),
  message: z.string().max(2000, 'Message too long').optional(),
});

export type Registration = z.infer<typeof registrationSchema>;

// ─── Public Endpoint Schemas ─────────────────────────────────────────────────

const looseTrimmedString = (max: number) =>
  z.string().max(max).transform((s) => s.trim());

const looseEmail = z
  .string()
  .min(1, 'Email is required')
  .max(254, 'Email too long')
  .email('Invalid email address')
  .transform((s) => s.trim().toLowerCase());

const looseUrl = z
  .string()
  .url('Invalid URL')
  .max(2000, 'URL too long')
  .optional()
  .or(z.literal(''))
  .transform((v) => v?.trim() || null);

export const voteSchema = z.object({
  entity_type: z.enum(['issue', 'area', 'event']).default('issue'),
  entity_slug: z.string().min(1).max(200, 'Slug too long'),
  vote: z.enum(['up', 'down']),
  feedback: looseTrimmedString(2000).optional().transform((v) => v || null),
  contact: looseTrimmedString(254).optional().transform((v) => v || null),
});

export type Vote = z.infer<typeof voteSchema>;

export const ambassadorApplySchema = z.object({
  first_name: looseTrimmedString(100).pipe(z.string().min(1, 'First name is required')),
  last_name: looseTrimmedString(100).pipe(z.string().min(1, 'Last name is required')),
  email: looseEmail,
  phone: looseTrimmedString(30).optional().transform((v) => v || null),
  organisation: looseTrimmedString(200).optional().transform((v) => v || null),
  role_title: looseTrimmedString(100).optional().transform((v) => v || null),
  state: z.string().max(50).optional().transform((v) => v || null),
  category_id: z.string().uuid().optional().transform((v) => v || null),
  why_ambassador: looseTrimmedString(5000).pipe(z.string().min(1, 'Motivation is required')),
  experience: looseTrimmedString(5000).optional().transform((v) => v || null),
  linkedin_url: looseUrl,
  website_url: looseUrl,
});

export type AmbassadorApply = z.infer<typeof ambassadorApplySchema>;

export const ambassadorNominateSchema = z.object({
  nominee_first_name: looseTrimmedString(100).pipe(z.string().min(1, 'Nominee first name is required')),
  nominee_last_name: looseTrimmedString(100).pipe(z.string().min(1, 'Nominee last name is required')),
  nominee_email: looseEmail.optional().transform((v) => v || null),
  nominee_phone: looseTrimmedString(30).optional().transform((v) => v || null),
  nominee_organisation: looseTrimmedString(200).optional().transform((v) => v || null),
  nominee_role_title: looseTrimmedString(100).optional().transform((v) => v || null),
  nominee_state: z.string().max(50).optional().transform((v) => v || null),
  category_id: z.string().uuid().optional().transform((v) => v || null),
  reason: looseTrimmedString(5000).pipe(z.string().min(1, 'Reason is required')),
  nominee_linkedin: looseUrl,
  nominator_name: looseTrimmedString(100).pipe(z.string().min(1, 'Your name is required')),
  nominator_email: looseEmail,
  nominator_phone: looseTrimmedString(30).optional().transform((v) => v || null),
  nominator_relation: looseTrimmedString(200).optional().transform((v) => v || null),
});

export type AmbassadorNominate = z.infer<typeof ambassadorNominateSchema>;

export const hubspotZoomSchema = z.object({
  hubspot_form_id: z.string().min(1, 'Form ID is required').max(100, 'Form ID too long'),
  zoom_webinar_ids: z.array(z.string().max(50)).max(10).optional(),
  fields: z.object({
    email: looseEmail,
    firstname: looseTrimmedString(100).pipe(z.string().min(1, 'First name is required')),
    lastname: looseTrimmedString(100).pipe(z.string().min(1, 'Last name is required')),
  }).passthrough(),
  context: z.object({
    pageUri: z.string().max(2000).optional(),
    pageName: z.string().max(200).optional(),
    hutk: z.string().max(200).optional(),
  }).optional(),
});

export type HubspotZoom = z.infer<typeof hubspotZoomSchema>;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Server-side helper: parse body or return a 400 NextResponse */
export function parseBody<T>(
  schema: z.ZodType<T>,
  body: unknown
): { ok: true; data: T } | { ok: false; response: NextResponse } {
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Validation failed', issues: result.error.issues.map(i => ({ path: i.path, message: i.message })) },
        { status: 400 }
      ),
    };
  }
  return { ok: true, data: result.data };
}

/** Lightweight helper for edge routes & client-side validation */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    return { success: false, error: messages.join(', ') };
  }
  return { success: true, data: result.data };
}
