/**
 * Seed script — populates Supabase with all static data
 * Run: $env:SUPABASE_SERVICE_ROLE_KEY="your-key"; node scripts/seed-db.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { ISSUES } from './data/issues.mjs';
import { STATES } from './data/states.mjs';
import { AREAS } from './data/areas.mjs';

const SUPABASE_URL = 'https://qxcdeyvfeipyfojpxosh.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error('❌  Set SUPABASE_SERVICE_ROLE_KEY env var first'); process.exit(1); }

const sb = createClient(SUPABASE_URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function seed(table, rows, label) {
  console.log(`\nSeeding ${label} (${rows.length} rows)...`);
  const { error } = await sb.from(table).upsert(rows, { onConflict: 'slug' });
  if (error) { console.error(`❌ ${label}:`, error.message); }
  else { console.log(`✅ ${label} done`); }
}

await seed('issues', ISSUES, 'Issues');
await seed('states', STATES, 'States');
await seed('areas',  AREAS,  'Areas');
console.log('\n✅ Seed complete');
