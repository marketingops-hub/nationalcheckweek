/**
 * enrich-school-areas.mjs
 *
 * Matches each school in school_profiles to an area slug by:
 *   1. Looking up the school's postcode in australian_postcodes → gets sa3_name
 *   2. Normalising sa3_name to a slug (lowercase, hyphens)
 *   3. Finding the closest matching slug in the areas table
 *   4. Writing area_slug back to school_profiles
 *
 * Run: node scripts/enrich-school-areas.mjs
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../.env.local') });

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BATCH_SIZE = 500;
const DRY_RUN = process.argv.includes('--dry-run');

/** Convert any string to a URL-style slug */
function slugify(str) {
  if (!str) return null;
  return str
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Simple similarity: count shared tokens between two slugs.
 * Returns a score 0–1 (1 = identical).
 */
function similarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const ta = new Set(a.split('-'));
  const tb = new Set(b.split('-'));
  const shared = [...ta].filter(t => tb.has(t)).length;
  return shared / Math.max(ta.size, tb.size);
}

// ── 1. Load all areas ──────────────────────────────────────────────
console.log('Loading areas...');
const { data: areas, error: areasErr } = await supabase
  .from('areas')
  .select('slug, name, state_slug');

if (areasErr) { console.error('Failed to load areas:', areasErr.message); process.exit(1); }
console.log(`  ${areas.length} areas loaded.`);

// Build a lookup: slug → { slug, name, state_slug }
const areaBySlug = Object.fromEntries(areas.map(a => [a.slug, a]));
const areaSlugs  = areas.map(a => a.slug);

// ── 2. Load postcode → sa3_name map (paginated) ──────────────────
console.log('Loading postcode → SA3 map...');
let postcodes = [];
let pcFrom = 0;
while (true) {
  const { data, error: pcErr } = await supabase
    .from('australian_postcodes')
    .select('postcode, state, sa3_name, sa4_name, lga_region')
    .range(pcFrom, pcFrom + BATCH_SIZE - 1);
  if (pcErr) { console.error('Failed to load postcodes:', pcErr.message); process.exit(1); }
  if (!data || data.length === 0) break;
  postcodes = postcodes.concat(data);
  pcFrom += data.length;
  if (data.length < BATCH_SIZE) break;
}
console.log(`  ${postcodes.length} postcode records loaded.`);

// Build postcode → best SA3 name (use first/most common entry per postcode)
const postcodeToSa3 = {};
for (const pc of postcodes) {
  if (!pc.postcode || !pc.sa3_name) continue;
  if (!postcodeToSa3[pc.postcode]) {
    postcodeToSa3[pc.postcode] = { sa3_name: pc.sa3_name, sa4_name: pc.sa4_name, state: pc.state };
  }
}
console.log(`  Unique postcodes with SA3: ${Object.keys(postcodeToSa3).length}`);

// ── 3. Build SA3 slug → area slug map ─────────────────────────────
// For each unique SA3 name, find the best matching area slug
console.log('Mapping SA3 names to area slugs...');

const sa3ToAreaSlug = {};
const uniqueSa3Names = [...new Set(Object.values(postcodeToSa3).map(v => v.sa3_name).filter(Boolean))];

let matched = 0;
let unmatched = [];

for (const sa3name of uniqueSa3Names) {
  const sa3slug = slugify(sa3name);
  if (!sa3slug) continue;

  // Exact match first
  if (areaBySlug[sa3slug]) {
    sa3ToAreaSlug[sa3name] = sa3slug;
    matched++;
    continue;
  }

  // Find best fuzzy match (token overlap)
  let bestSlug = null;
  let bestScore = 0;

  for (const areaSlug of areaSlugs) {
    const score = similarity(sa3slug, areaSlug);
    if (score > bestScore) {
      bestScore = score;
      bestSlug = areaSlug;
    }
  }

  // Only accept if similarity is strong enough (≥ 0.5)
  if (bestScore >= 0.5 && bestSlug) {
    sa3ToAreaSlug[sa3name] = bestSlug;
    matched++;
  } else {
    unmatched.push({ sa3name, sa3slug, bestSlug, bestScore });
  }
}

console.log(`  Matched: ${matched} / ${uniqueSa3Names.length} SA3 regions`);
if (unmatched.length > 0) {
  console.log(`  Unmatched SA3 regions (${unmatched.length}):`);
  for (const u of unmatched.slice(0, 20)) {
    console.log(`    "${u.sa3name}" (slug: ${u.sa3slug}) — closest: ${u.bestSlug} (${(u.bestScore * 100).toFixed(0)}%)`);
  }
  if (unmatched.length > 20) console.log(`    ... and ${unmatched.length - 20} more`);
}

// ── 4. Load all schools (just id + postcode) ──────────────────────
console.log('\nLoading schools...');
let allSchools = [];
let from = 0;
while (true) {
  const { data, error } = await supabase
    .from('school_profiles')
    .select('id, postcode, state')
    .range(from, from + BATCH_SIZE - 1);
  if (error) { console.error('Error loading schools:', error.message); process.exit(1); }
  if (!data || data.length === 0) break;
  allSchools = allSchools.concat(data);
  from += data.length;
  if (data.length < BATCH_SIZE) break;
}
console.log(`  ${allSchools.length} schools loaded.`);

// ── 5. Resolve area_slug for each school ──────────────────────────
const updates = [];
let noPostcode = 0;
let noSa3 = 0;
let noArea = 0;

for (const school of allSchools) {
  const pc = school.postcode?.toString().trim();
  if (!pc) { noPostcode++; continue; }

  const pcData = postcodeToSa3[pc];
  if (!pcData?.sa3_name) { noSa3++; continue; }

  const areaSlug = sa3ToAreaSlug[pcData.sa3_name];
  if (!areaSlug) { noArea++; continue; }

  updates.push({ id: school.id, area_slug: areaSlug });
}

console.log(`\nResolution summary:`);
console.log(`  Will update:      ${updates.length}`);
console.log(`  No postcode:      ${noPostcode}`);
console.log(`  No SA3 in table:  ${noSa3}`);
console.log(`  No area match:    ${noArea}`);

if (updates.length === 0) {
  console.log('\nNothing to update. Check that areas and postcodes are loaded.');
  process.exit(0);
}

if (DRY_RUN) {
  console.log('\n[DRY RUN] No writes performed. Sample of updates that would occur:');
  for (const u of updates.slice(0, 10)) {
    console.log(`  school id=${u.id} → area_slug="${u.area_slug}"`);
  }
  if (updates.length > 10) console.log(`  ... and ${updates.length - 10} more`);
  process.exit(0);
}

// ── 6. Write area_slug back to school_profiles (concurrent batches) ──
console.log('\nWriting area_slug to school_profiles...');
let written = 0;
let writeErrors = 0;

// Group updates by area_slug so we can use .in() for bulk updates
const byArea = {};
for (const u of updates) {
  if (!byArea[u.area_slug]) byArea[u.area_slug] = [];
  byArea[u.area_slug].push(u.id);
}

const areaEntries = Object.entries(byArea);
console.log(`  Updating ${areaEntries.length} area groups (${updates.length} schools total)...`);

const CONCURRENCY = 5;
for (let i = 0; i < areaEntries.length; i += CONCURRENCY) {
  const chunk = areaEntries.slice(i, i + CONCURRENCY);
  await Promise.all(chunk.map(async ([areaSlug, ids]) => {
    const { error } = await supabase
      .from('school_profiles')
      .update({ area_slug: areaSlug })
      .in('id', ids);
    if (error) {
      writeErrors++;
      console.error(`  Error updating area "${areaSlug}":`, error.message);
    } else {
      written += ids.length;
    }
  }));
  process.stdout.write(`\r  Written ${written}/${updates.length}...`);
}

console.log(`\n\nDone.`);
console.log(`  ${written} schools enriched with area_slug.`);
console.log(`  ${writeErrors} group errors.`);
if (DRY_RUN === false) {
  console.log(`\nTip: Run with --dry-run to preview changes without writing.`);
}
console.log(`\nNext step: schools with area_slug can now be queried per /areas/[slug] page.`);
