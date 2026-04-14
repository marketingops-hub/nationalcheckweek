import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CSV_PATH = join(__dirname, '../csv/School Profile 2025.xlsx - SchoolProfile 2025.csv');
const BATCH_SIZE = 500;

function toNum(val) {
  if (val === '' || val == null) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function toInt(val) {
  if (val === '' || val == null) return null;
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

const raw = readFileSync(CSV_PATH, 'utf8');
const records = parse(raw, { columns: true, skip_empty_lines: true, trim: true });

console.log(`Parsed ${records.length} rows from CSV`);

const rows = records.map(r => ({
  calendar_year:                r['Calendar Year']                                        ? toInt(r['Calendar Year']) : null,
  acara_sml_id:                 toInt(r['ACARA SML ID']),
  school_name:                  r['School Name'],
  suburb:                       r['Suburb'] || null,
  state:                        r['State'] || null,
  postcode:                     r['Postcode'] || null,
  school_sector:                r['School Sector'] || null,
  school_type:                  r['School Type'] || null,
  school_url:                   r['School URL'] || null,
  governing_body:               r['Governing Body'] || null,
  governing_body_url:           r['Governing Body URL'] || null,
  year_range:                   r['Year Range'] || null,
  geolocation:                  r['Geolocation'] || null,
  icsea:                        toInt(r['ICSEA']),
  icsea_percentile:             toInt(r['ICSEA Percentile']),
  bottom_sea_quarter_pct:       toNum(r['Bottom SEA Quarter (%)']),
  lower_middle_sea_quarter_pct: toNum(r['Lower Middle SEA Quarter (%)']),
  upper_middle_sea_quarter_pct: toNum(r['Upper Middle SEA Quarter (%)']),
  top_sea_quarter_pct:          toNum(r['Top SEA Quarter (%)']),
  teaching_staff:               toInt(r['Teaching Staff']),
  fte_teaching_staff:           toNum(r['Full Time Equivalent Teaching Staff']),
  non_teaching_staff:           toInt(r['Non-Teaching Staff']),
  fte_non_teaching_staff:       toNum(r['Full Time Equivalent Non-Teaching Staff']),
  total_enrolments:             toInt(r['Total Enrolments']),
  girls_enrolments:             toInt(r['Girls Enrolments']),
  boys_enrolments:              toInt(r['Boys Enrolments']),
  fte_enrolments:               toNum(r['Full Time Equivalent Enrolments']),
  indigenous_enrolments_pct:    toNum(r['Indigenous Enrolments (%)']),
  lbote_yes_pct:                toNum(r['Language Background Other Than English - Yes (%)']),
  lbote_no_pct:                 toNum(r['Language Background Other Than English - No (%)']),
  lbote_not_stated_pct:         toNum(r['Language Background Other Than English - Not Stated (%)']),
}));

let inserted = 0;
let errors = 0;

for (let i = 0; i < rows.length; i += BATCH_SIZE) {
  const batch = rows.slice(i, i + BATCH_SIZE);
  const { error } = await supabase
    .from('school_profiles')
    .upsert(batch, { onConflict: 'acara_sml_id' });

  if (error) {
    console.error(`Batch ${i}–${i + batch.length} error:`, error.message);
    errors += batch.length;
  } else {
    inserted += batch.length;
    console.log(`✓ ${inserted}/${rows.length} rows upserted`);
  }
}

console.log(`\nDone. Inserted/updated: ${inserted} | Errors: ${errors}`);
