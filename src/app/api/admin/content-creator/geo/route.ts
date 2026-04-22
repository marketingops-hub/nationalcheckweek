/* ═══════════════════════════════════════════════════════════════════════════
 * POST /api/admin/content-creator/geo
 *
 * Create a GEO content draft that pairs one `areas` row (town) with one
 * `issues` row (wellbeing topic). Skips the ideas stage (the area+issue
 * pair is already the topic) and lands directly in status='approved_idea'
 * so the draft detail page's "Generate" button picks up right away.
 *
 * Body: { area_slug, issue_slug, brief?: { tone?, audience?, style_id?,
 *         length_preset? } }
 *
 * Response on success: { draft: ContentDraft }
 *
 * Errors:
 *   400 — bad slug / zod failure / unknown area or issue
 *   409 — a GEO draft for this (area, issue) pair already exists in a
 *         non-archived status (prevents accidental doubles)
 * ═══════════════════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { GenerateGeoDraftSchema } from '@/lib/content-creator/schemas';
import { ok, err, parseJsonBody, validate, pgError } from '@/lib/content-creator/api-helpers';

export const runtime = 'nodejs';

export const POST = requireAdmin(async (req: NextRequest) => {
  const raw = await parseJsonBody(req);
  if (raw instanceof NextResponse) return raw;
  const parsed = validate(GenerateGeoDraftSchema, raw);
  if (parsed instanceof NextResponse) return parsed;
  const { area_slug, issue_slug, brief, new_area } = parsed;

  const sb = adminClient();

  /* ─── Resolve area + issue ───────────────────────────────────────── */
  const [areaRes, issueRes] = await Promise.all([
    sb.from('areas')
      .select('id, slug, name, state, type')
      .eq('slug', area_slug)
      .maybeSingle(),
    sb.from('issues')
      .select('id, slug, title, severity, anchor_stat')
      .eq('slug', issue_slug)
      .maybeSingle(),
  ]);

  if (areaRes.error)  return pgError(areaRes.error);
  if (issueRes.error) return pgError(issueRes.error);
  if (!issueRes.data) return err(`Unknown issue slug: '${issue_slug}'.`, 400);

  /* ─── Auto-create area if missing and the client supplied new_area ── */
  // State is required in this path — the BriefForm enforces it at the
  // HTML level but we re-check here so a malformed client call still
  // gets a useful error instead of a cryptic NOT NULL violation.
  let area = areaRes.data;
  if (!area) {
    if (!new_area) {
      return err(
        `Unknown area slug: '${area_slug}'. Provide new_area.name + new_area.state to auto-create it.`,
        400,
      );
    }
    const { data: inserted, error: areaInsErr } = await sb
      .from('areas')
      .insert({
        slug:   area_slug,
        name:   new_area.name,
        state:  new_area.state,
        type:   'town',
        issues: [],
      })
      .select('id, slug, name, state, type')
      .single();
    if (areaInsErr) return pgError(areaInsErr);
    area = inserted;
  }

  const issue = issueRes.data;

  /* ─── Dedupe check ───────────────────────────────────────────────── */
  // One active GEO draft per (area, issue) pair. Archived rows are
  // exempt so an admin can intentionally re-create after archiving.
  const { data: existing, error: dupErr } = await sb
    .from('content_drafts')
    .select('id, status')
    .eq('content_type', 'geo')
    .contains('brief', { area_slug, issue_slug })
    .neq('status', 'archived')
    .limit(1);
  if (dupErr) return pgError(dupErr);
  if (existing && existing.length > 0) {
    return err(
      `A GEO draft for ${area.name} × ${issue.title} already exists (status '${existing[0].status}'). Open it instead, or archive it to start over.`,
      409,
    );
  }

  /* ─── Compose the draft row ──────────────────────────────────────── */
  // Title is user-visible and SEO-facing; topic is the internal handle
  // that flows into the generate prompt's "topic:" line. Keep them in
  // sync but distinct so the admin can still re-word the title later
  // without losing provenance.
  const title = `${area.name}, ${area.state}: ${issue.title}`;
  const topic = `${issue.title} in ${area.name}, ${area.state}`;

  // vault_category narrows the RAG window to entries tagged with the
  // issue slug. Matches the convention used by the blog pipeline where
  // the admin manually picks a vault_category on the brief form.
  const vaultCategory = issue.slug;

  const briefPayload = {
    topic,
    tone:           brief?.tone,
    audience:       brief?.audience,
    style_id:       brief?.style_id ?? null,
    length_preset:  brief?.length_preset ?? 'standard',
    vault_category: vaultCategory,
    area_slug:      area.slug,
    issue_slug:     issue.slug,
  };

  const { data: draft, error: insErr } = await sb
    .from('content_drafts')
    .insert({
      content_type: 'geo',
      status:       'approved_idea', // skips ideas; Generate works immediately
      title,
      body:         '',
      brief:        briefPayload,
      ai_metadata:  {},
      verification: {},
      vault_refs:   [],
    })
    .select()
    .single();
  if (insErr) return pgError(insErr);

  return ok({ draft }, 201);
});
