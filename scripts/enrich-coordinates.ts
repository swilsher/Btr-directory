/**
 * BTR Directory — Postcode-to-Coordinate Enrichment Script
 *
 * One-time script to populate latitude/longitude for developments
 * that have a postcode but no coordinates.
 *
 * Uses postcodes.io bulk API (free, no API key needed).
 * Falls back to outcode lookup for partial postcodes (e.g. "M4", "LS1").
 *
 * Usage:
 *   cd scripts && npx tsx enrich-coordinates.ts
 *   cd scripts && npx tsx enrich-coordinates.ts --dry-run
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '.env'), override: true });

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BATCH_SIZE = 100; // postcodes.io max per request
const DELAY_MS = 500; // be respectful to the free API

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in scripts/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const dryRun = process.argv.includes('--dry-run');

interface DevRow {
  id: string;
  name: string;
  postcode: string;
}

interface PostcodeResult {
  query: string;
  result: {
    postcode: string;
    latitude: number;
    longitude: number;
    admin_district: string;
    region: string | null;
    country: string;
  } | null;
}

interface OutcodeResult {
  latitude: number;
  longitude: number;
  admin_district: string[];
  country: string[];
}

/**
 * Detect if a postcode is a full postcode or just an outcode.
 * Full UK postcodes have the pattern: outcode + space + incode (3 chars: digit letter letter)
 * e.g. "M4 1AB", "LS1 5EF", "SW1A 1AA"
 * Outcodes are just the first part: "M4", "LS1", "SW1A"
 */
function isFullPostcode(postcode: string): boolean {
  const cleaned = postcode.replace(/\s+/g, '').toUpperCase();
  // Full UK postcodes are 5-7 chars without spaces. Outcodes are 2-4 chars.
  // The incode is always 3 characters (digit + letter + letter) at the end.
  // So if the last 3 chars match [0-9][A-Z][A-Z], it's likely a full postcode.
  return cleaned.length >= 5 && /\d[A-Z]{2}$/.test(cleaned);
}

async function fetchDevelopmentsNeedingCoords(): Promise<DevRow[]> {
  // Fetch all developments that have a postcode but no latitude
  const { data, error } = await supabase
    .from('developments')
    .select('id, name, postcode')
    .not('postcode', 'is', null)
    .is('latitude', null)
    .order('name');

  if (error) {
    console.error('Supabase query error:', error.message);
    process.exit(1);
  }

  // Filter out empty/whitespace-only postcodes
  return (data || []).filter(d => d.postcode && d.postcode.trim() !== '');
}

async function bulkLookupPostcodes(postcodes: string[]): Promise<PostcodeResult[]> {
  const resp = await fetch('https://api.postcodes.io/postcodes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postcodes }),
  });

  if (!resp.ok) {
    throw new Error(`postcodes.io returned ${resp.status}: ${resp.statusText}`);
  }

  const data = await resp.json();
  return data.result || [];
}

async function lookupOutcode(outcode: string): Promise<OutcodeResult | null> {
  const cleaned = outcode.replace(/\s+/g, '').toUpperCase();
  const resp = await fetch(`https://api.postcodes.io/outcodes/${encodeURIComponent(cleaned)}`);

  if (!resp.ok) {
    return null;
  }

  const data = await resp.json();
  return data.result || null;
}

async function updateDevelopment(
  id: string,
  latitude: number,
  longitude: number,
  area: string | null,
  region: string | null
): Promise<boolean> {
  const updateFields: Record<string, unknown> = { latitude, longitude };

  // Only fill in area/region if the development doesn't already have them
  if (area) updateFields.area = area;
  if (region) updateFields.region = region;

  const { error } = await supabase
    .from('developments')
    .update(updateFields)
    .eq('id', id);

  if (error) {
    console.error(`  Failed to update ${id}: ${error.message}`);
    return false;
  }
  return true;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('');
  console.log('='.repeat(60));
  console.log('BTR Directory — Postcode Enrichment');
  console.log('='.repeat(60));
  if (dryRun) console.log('  MODE: DRY RUN (no database writes)');
  console.log('');

  // Step 1: Fetch developments needing coordinates
  console.log('Step 1: Fetching developments with postcodes but no coordinates...');
  const devs = await fetchDevelopmentsNeedingCoords();
  console.log(`  Found ${devs.length} developments to enrich`);

  if (devs.length === 0) {
    console.log('  Nothing to do — all developments with postcodes already have coordinates.');
    return;
  }

  // Separate into full postcodes and outcodes
  const fullPostcodeDevs = devs.filter(d => isFullPostcode(d.postcode));
  const outcodeDevs = devs.filter(d => !isFullPostcode(d.postcode));

  console.log(`  Full postcodes: ${fullPostcodeDevs.length}`);
  console.log(`  Outcodes only:  ${outcodeDevs.length}`);

  let enriched = 0;
  let enrichedFromOutcode = 0;
  let failed = 0;
  let invalidPostcode = 0;
  const failedList: { name: string; postcode: string; reason: string }[] = [];

  // Step 2: Batch lookup full postcodes
  if (fullPostcodeDevs.length > 0) {
    console.log('');
    console.log('Step 2: Looking up full postcodes via postcodes.io bulk API...');

    const batches: DevRow[][] = [];
    for (let i = 0; i < fullPostcodeDevs.length; i += BATCH_SIZE) {
      batches.push(fullPostcodeDevs.slice(i, i + BATCH_SIZE));
    }
    console.log(`  ${batches.length} batch(es) of up to ${BATCH_SIZE} postcodes each`);

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];

      if (batchIdx > 0) await sleep(DELAY_MS);

      console.log(`  Batch ${batchIdx + 1}/${batches.length} (${batch.length} postcodes)...`);

      const postcodes = batch.map(d => d.postcode.trim());
      let results: PostcodeResult[];

      try {
        results = await bulkLookupPostcodes(postcodes);
      } catch (err) {
        console.error(`    ERROR: ${err}`);
        failed += batch.length;
        batch.forEach(d => failedList.push({ name: d.name, postcode: d.postcode, reason: 'API error' }));
        continue;
      }

      // Map results back to developments
      const resultMap = new Map<string, PostcodeResult['result']>();
      for (const r of results) {
        resultMap.set(r.query.replace(/\s+/g, '').toUpperCase(), r.result);
      }

      for (const dev of batch) {
        const normalizedPostcode = dev.postcode.replace(/\s+/g, '').toUpperCase();
        const result = resultMap.get(normalizedPostcode);

        if (!result) {
          invalidPostcode++;
          failedList.push({ name: dev.name, postcode: dev.postcode, reason: 'Invalid/terminated postcode' });
          continue;
        }

        if (dryRun) {
          console.log(`    [DRY RUN] ${dev.name}: ${result.latitude}, ${result.longitude} (${result.admin_district})`);
          enriched++;
        } else {
          const region = result.region || result.country;
          const success = await updateDevelopment(dev.id, result.latitude, result.longitude, result.admin_district, region);
          if (success) {
            enriched++;
          } else {
            failed++;
            failedList.push({ name: dev.name, postcode: dev.postcode, reason: 'Database update failed' });
          }
        }
      }
    }
  }

  // Step 3: Outcode lookup for partial postcodes (one at a time since there's no bulk endpoint)
  if (outcodeDevs.length > 0) {
    console.log('');
    console.log(`Step 3: Looking up ${outcodeDevs.length} outcodes via postcodes.io...`);
    console.log('  (These are approximate coordinates based on outcode centroids)');

    for (let i = 0; i < outcodeDevs.length; i++) {
      const dev = outcodeDevs[i];

      if (i > 0 && i % 10 === 0) {
        await sleep(DELAY_MS);
        console.log(`  Progress: ${i}/${outcodeDevs.length}...`);
      }

      try {
        const result = await lookupOutcode(dev.postcode);

        if (!result) {
          invalidPostcode++;
          failedList.push({ name: dev.name, postcode: dev.postcode, reason: 'Invalid outcode' });
          continue;
        }

        const area = result.admin_district?.[0] || null;
        const region = result.country?.[0] || null;

        if (dryRun) {
          console.log(`    [DRY RUN] ${dev.name} (${dev.postcode}): ${result.latitude}, ${result.longitude} (${area || 'unknown'})`);
          enrichedFromOutcode++;
        } else {
          const success = await updateDevelopment(dev.id, result.latitude, result.longitude, area, region);
          if (success) {
            enrichedFromOutcode++;
          } else {
            failed++;
            failedList.push({ name: dev.name, postcode: dev.postcode, reason: 'Database update failed' });
          }
        }
      } catch (err) {
        failed++;
        failedList.push({ name: dev.name, postcode: dev.postcode, reason: `API error: ${err}` });
      }
    }
    console.log(`  Progress: ${outcodeDevs.length}/${outcodeDevs.length} done.`);
  }

  // Summary
  console.log('');
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Total to enrich:           ${devs.length}`);
  console.log(`  Full postcodes ${dryRun ? 'resolved' : 'updated'}:    ${enriched}`);
  console.log(`  Outcodes ${dryRun ? 'resolved' : 'updated'}:          ${enrichedFromOutcode} (approximate)`);
  console.log(`  Total enriched:            ${enriched + enrichedFromOutcode}`);
  console.log(`  Invalid postcodes:         ${invalidPostcode}`);
  console.log(`  Other failures:            ${failed}`);

  if (failedList.length > 0) {
    console.log('');
    console.log('  Failed items:');
    for (const f of failedList) {
      console.log(`    - ${f.name} (${f.postcode}): ${f.reason}`);
    }
  }

  console.log('');
  if (dryRun) {
    console.log('  This was a DRY RUN. No database changes were made.');
    console.log('  Run without --dry-run to apply changes.');
  } else {
    console.log('  Done. Coordinates have been written to the database.');
    console.log(`  Note: ${enrichedFromOutcode} developments used outcode centroids (approximate).`);
  }
  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
