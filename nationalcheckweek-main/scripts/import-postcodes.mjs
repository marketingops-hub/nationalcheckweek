import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
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

const CSV_PATH = join(__dirname, '../csv/australian_postcodes.csv');
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

function clean(val) {
  if (val === '' || val == null) return null;
  return val.trim() || null;
}

const raw = readFileSync(CSV_PATH, 'utf8');
const records = parse(raw, { columns: true, skip_empty_lines: true, trim: true });

console.log(`Parsed ${records.length} rows from CSV`);

const rows = records.map(r => ({
  id:           toInt(r['id']),
  postcode:     r['postcode'],
  locality:     r['locality'],
  state:        clean(r['state']),
  longitude:    toNum(r['long']),
  latitude:     toNum(r['lat']),
  lat_precise:  toNum(r['Lat_precise']),
  long_precise: toNum(r['Long_precise']),
  type:         clean(r['type']),
  status:       clean(r['status']),
  sa3_code:     clean(r['sa3']),
  sa3_name:     clean(r['sa3name']),
  sa4_code:     clean(r['sa4']),
  sa4_name:     clean(r['sa4name']),
  sa2_code:     clean(r['SA2_CODE_2021']),
  sa2_name:     clean(r['SA2_NAME_2021']),
  sa1_code:     clean(r['SA1_CODE_2021']),
  region:       clean(r['region']),
  ra_2021:      clean(r['RA_2021']),
  ra_2021_name: clean(r['RA_2021_NAME']),
  lga_region:   clean(r['lgaregion']),
  lga_code:     clean(r['lgacode']),
  phn_code:     clean(r['phn_code']),
  phn_name:     clean(r['phn_name']),
  electorate:   clean(r['electorate']),
})).filter(r => r.id != null && r.postcode && r.locality);

console.log(`Valid rows to insert: ${rows.length}`);

let inserted = 0;
let errors = 0;

for (let i = 0; i < rows.length; i += BATCH_SIZE) {
  const batch = rows.slice(i, i + BATCH_SIZE);
  const { error } = await supabase
    .from('australian_postcodes')
    .upsert(batch, { onConflict: 'id' });

  if (error) {
    console.error(`Batch ${i / BATCH_SIZE + 1} error:`, error.message);
    errors++;
  } else {
    inserted += batch.length;
    process.stdout.write(`\rInserted ${inserted}/${rows.length}...`);
  }
}

console.log(`\nDone. ${inserted} rows inserted, ${errors} batch errors.`);
