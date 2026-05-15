import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';

// Validation constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_ROWS = 100000; // Prevent memory exhaustion
const REQUIRED_HEADERS = ['ACARA SML ID', 'School Name'];
const VALID_STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];
const VALID_SECTORS = ['Government', 'Catholic', 'Independent'];

/** Sanitize string input - remove dangerous characters */
function sanitizeString(val: string | undefined): string {
  if (!val) return '';
  // Remove null bytes, control characters, and trim
  return val.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

/** Validate URL format */
function isValidUrl(url: string): boolean {
  if (!url) return true; // null/empty is valid
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Validate percentage is between 0-100 */
function isValidPercentage(val: number | null): boolean {
  if (val === null) return true;
  return val >= 0 && val <= 100;
}

/** Validate year is reasonable */
function isValidYear(val: number | null): boolean {
  if (val === null) return true;
  return val >= 2000 && val <= 2100;
}

function toNum(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function toInt(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

/** RFC 4180-compliant CSV field splitter — handles quoted fields with embedded commas/newlines */
function splitCSVLine(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i <= line.length) {
    if (line[i] === '"') {
      // Quoted field
      let val = '';
      i++; // skip opening quote
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          val += '"'; i += 2; // escaped quote
        } else if (line[i] === '"') {
          i++; break; // closing quote
        } else {
          val += line[i++];
        }
      }
      fields.push(val);
      if (line[i] === ',') i++; // skip comma after closing quote
    } else {
      // Unquoted field — read until next comma
      const start = i;
      while (i < line.length && line[i] !== ',') i++;
      fields.push(line.slice(start, i).trim());
      if (line[i] === ',') i++;
    }
  }
  return fields;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = splitCSVLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const vals = splitCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (vals[i] ?? '').trim(); });
    return row;
  });
}

const BATCH = 500;

export const POST = requireAdmin(async (req: NextRequest) => {
  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });

  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

  // Validate file type
  if (!file.name.endsWith('.csv')) {
    return NextResponse.json({ error: 'Only .csv files are allowed' }, { status: 400 });
  }

  // Validate MIME type
  const validMimeTypes = ['text/csv', 'application/csv', 'text/plain'];
  if (!validMimeTypes.includes(file.type) && file.type !== '') {
    return NextResponse.json({ error: 'Invalid file type. Expected CSV.' }, { status: 400 });
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File exceeds 50 MB limit' }, { status: 413 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty' }, { status: 400 });
  }

  const text = await file.text();
  
  // Validate CSV structure
  const records = parseCSV(text);
  if (records.length === 0) {
    return NextResponse.json({ error: 'CSV has no data rows' }, { status: 400 });
  }

  if (records.length > MAX_ROWS) {
    return NextResponse.json({ 
      error: `CSV exceeds maximum of ${MAX_ROWS.toLocaleString()} rows` 
    }, { status: 413 });
  }

  // Validate required headers are present
  const firstRecord = records[0];
  const missingHeaders = REQUIRED_HEADERS.filter(h => !(h in firstRecord));
  if (missingHeaders.length > 0) {
    return NextResponse.json({ 
      error: `Missing required columns: ${missingHeaders.join(', ')}` 
    }, { status: 400 });
  }

  // Validate and sanitize each row
  const validationErrors: string[] = [];
  const rows = records.map((r, idx) => {
    const rowNum = idx + 2; // +2 because row 1 is headers, array is 0-indexed

    // Required field validation
    const acaraId = toInt(r['ACARA SML ID']);
    if (!acaraId) {
      validationErrors.push(`Row ${rowNum}: Missing or invalid ACARA SML ID`);
    }

    const schoolName = sanitizeString(r['School Name']);
    if (!schoolName || schoolName.length < 2) {
      validationErrors.push(`Row ${rowNum}: Missing or invalid School Name`);
    }
    if (schoolName.length > 200) {
      validationErrors.push(`Row ${rowNum}: School Name exceeds 200 characters`);
    }

    // State validation
    const state = sanitizeString(r['State']);
    if (state && !VALID_STATES.includes(state)) {
      validationErrors.push(`Row ${rowNum}: Invalid state '${state}'. Must be one of: ${VALID_STATES.join(', ')}`);
    }

    // Sector validation
    const sector = sanitizeString(r['School Sector']);
    if (sector && !VALID_SECTORS.includes(sector)) {
      validationErrors.push(`Row ${rowNum}: Invalid sector '${sector}'. Must be one of: ${VALID_SECTORS.join(', ')}`);
    }

    // URL validation
    const schoolUrl = sanitizeString(r['School URL']);
    if (schoolUrl && !isValidUrl(schoolUrl)) {
      validationErrors.push(`Row ${rowNum}: Invalid School URL format`);
    }

    const govBodyUrl = sanitizeString(r['Governing Body URL']);
    if (govBodyUrl && !isValidUrl(govBodyUrl)) {
      validationErrors.push(`Row ${rowNum}: Invalid Governing Body URL format`);
    }

    // Year validation
    const calendarYear = toInt(r['Calendar Year']);
    if (!isValidYear(calendarYear)) {
      validationErrors.push(`Row ${rowNum}: Invalid Calendar Year`);
    }

    // Percentage validations
    const percentageFields = [
      ['Bottom SEA Quarter (%)', toNum(r['Bottom SEA Quarter (%)'])],
      ['Lower Middle SEA Quarter (%)', toNum(r['Lower Middle SEA Quarter (%)'])],
      ['Upper Middle SEA Quarter (%)', toNum(r['Upper Middle SEA Quarter (%)'])],
      ['Top SEA Quarter (%)', toNum(r['Top SEA Quarter (%)'])],
      ['Indigenous Enrolments (%)', toNum(r['Indigenous Enrolments (%)'])],
      ['LBOTE Yes (%)', toNum(r['Language Background Other Than English - Yes (%)'])],
      ['LBOTE No (%)', toNum(r['Language Background Other Than English - No (%)'])],
      ['LBOTE Not Stated (%)', toNum(r['Language Background Other Than English - Not Stated (%)'])],
    ] as const;

    percentageFields.forEach(([fieldName, value]) => {
      if (!isValidPercentage(value)) {
        validationErrors.push(`Row ${rowNum}: ${fieldName} must be between 0-100`);
      }
    });

    // ICSEA percentile validation
    const icseaPercentile = toInt(r['ICSEA Percentile']);
    if (icseaPercentile !== null && (icseaPercentile < 0 || icseaPercentile > 100)) {
      validationErrors.push(`Row ${rowNum}: ICSEA Percentile must be between 0-100`);
    }

    // Negative number validation
    const numericFields = [
      ['Teaching Staff', toInt(r['Teaching Staff'])],
      ['Non-Teaching Staff', toInt(r['Non-Teaching Staff'])],
      ['Total Enrolments', toInt(r['Total Enrolments'])],
      ['Girls Enrolments', toInt(r['Girls Enrolments'])],
      ['Boys Enrolments', toInt(r['Boys Enrolments'])],
    ] as const;

    numericFields.forEach(([fieldName, value]) => {
      if (value !== null && value < 0) {
        validationErrors.push(`Row ${rowNum}: ${fieldName} cannot be negative`);
      }
    });

    return {
      calendar_year:                calendarYear,
      acara_sml_id:                 acaraId,
      school_name:                  schoolName,
      suburb:                       sanitizeString(r['Suburb']) || null,
      state:                        state || null,
      postcode:                     sanitizeString(r['Postcode']) || null,
      school_sector:                sector || null,
      school_type:                  sanitizeString(r['School Type']) || null,
      school_url:                   schoolUrl || null,
      governing_body:               sanitizeString(r['Governing Body']) || null,
      governing_body_url:           govBodyUrl || null,
      year_range:                   sanitizeString(r['Year Range']) || null,
      geolocation:                  sanitizeString(r['Geolocation']) || null,
      icsea:                        toInt(r['ICSEA']),
      icsea_percentile:             icseaPercentile,
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
    };
  });

  // Return validation errors if any critical issues found
  if (validationErrors.length > 0) {
    // Limit error messages to first 50 to avoid overwhelming response
    const errorSample = validationErrors.slice(0, 50);
    const remaining = validationErrors.length - errorSample.length;
    return NextResponse.json({ 
      error: 'CSV validation failed',
      validationErrors: errorSample,
      totalErrors: validationErrors.length,
      message: remaining > 0 ? `Showing first 50 errors. ${remaining} more errors found.` : undefined
    }, { status: 422 });
  }

  const sb = adminClient();
  let inserted = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await sb
      .from('school_profiles')
      .upsert(batch, { onConflict: 'acara_sml_id' });
    if (error) {
      errors.push(`Batch ${i}–${i + batch.length}: ${error.message}`);
    } else {
      inserted += batch.length;
    }
  }

  return NextResponse.json({
    total: records.length,
    inserted,
    errors: errors.length > 0 ? errors : undefined,
  });
});
