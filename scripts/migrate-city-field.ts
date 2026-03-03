#!/usr/bin/env tsx
/**
 * Data Migration: Populate the new `city` column on developments.
 *
 * This script:
 * 1. Reads all developments from Supabase
 * 2. For each development, derives city (and corrects area) using:
 *    - Postcode → city mapping (most reliable)
 *    - Existing area value analysis (city-as-area, borough-as-area, metro sub-area)
 * 3. Updates the developments in Supabase
 *
 * Usage:
 *   cd scripts && npx tsx migrate-city-field.ts [--dry-run] [--verbose]
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in ../.env.local
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import {
  postcodeToCity,
  postcodeToBorough,
  isKnownCity,
  isLondonBorough,
  getParentCity,
  resolveLocation,
} from './lib/postcode-regions.js';

// Load .env.local from project root
config({ path: resolve(import.meta.dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(chalk.red('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local'));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');

interface DevRow {
  id: string;
  name: string;
  area: string | null;
  city: string | null;
  region: string | null;
  postcode: string | null;
}

async function main() {
  console.log(chalk.blue.bold('\n🏙️  City Field Migration\n'));
  if (dryRun) console.log(chalk.yellow('  DRY RUN — no changes will be written\n'));

  // Fetch all developments
  const { data: developments, error } = await supabase
    .from('developments')
    .select('id, name, area, city, region, postcode')
    .order('name');

  if (error) {
    console.error(chalk.red('Failed to fetch developments:'), error.message);
    process.exit(1);
  }

  if (!developments || developments.length === 0) {
    console.log(chalk.yellow('No developments found.'));
    return;
  }

  console.log(chalk.gray(`Found ${developments.length} developments\n`));

  let updated = 0;
  let skipped = 0;
  let noChange = 0;
  const changes: Array<{ name: string; before: { city: string | null; area: string | null }; after: { city?: string; area?: string } }> = [];

  for (const dev of developments as DevRow[]) {
    // Skip if city is already set (unless area needs correction)
    if (dev.city && !isKnownCity(dev.area || '')) {
      noChange++;
      continue;
    }

    const resolved = resolveLocation(dev.area || undefined, dev.postcode || undefined);

    // Nothing could be resolved
    if (!resolved.city) {
      skipped++;
      if (verbose) {
        console.log(chalk.gray(`  SKIP: ${dev.name} — no city derivable (area="${dev.area}", postcode="${dev.postcode}")`));
      }
      continue;
    }

    // Check if anything actually changed
    const cityChanged = resolved.city !== dev.city;
    const areaChanged = (resolved.area || null) !== dev.area;

    if (!cityChanged && !areaChanged) {
      noChange++;
      continue;
    }

    const change = {
      name: dev.name,
      before: { city: dev.city, area: dev.area },
      after: { city: resolved.city, area: resolved.area },
    };
    changes.push(change);

    if (verbose) {
      console.log(
        chalk.green(`  UPDATE: ${dev.name}`),
        chalk.gray(`city: ${dev.city || '(null)'} → ${resolved.city}`),
        chalk.gray(`area: ${dev.area || '(null)'} → ${resolved.area || '(null)'}`)
      );
    }

    if (!dryRun) {
      const updateData: Record<string, string | null> = {
        city: resolved.city,
        area: resolved.area || null,
      };

      const { error: updateError } = await supabase
        .from('developments')
        .update(updateData)
        .eq('id', dev.id);

      if (updateError) {
        console.error(chalk.red(`  ERROR updating ${dev.name}: ${updateError.message}`));
        continue;
      }
    }

    updated++;
  }

  // Summary
  console.log(chalk.blue.bold('\n📊 Summary\n'));
  console.log(`  Total developments: ${chalk.white(developments.length)}`);
  console.log(`  Updated:            ${chalk.green(updated)}`);
  console.log(`  Already correct:    ${chalk.gray(noChange)}`);
  console.log(`  Skipped (no data):  ${chalk.yellow(skipped)}`);

  if (changes.length > 0) {
    console.log(chalk.blue.bold('\n📝 Changes' + (dryRun ? ' (would be applied)' : ' applied') + ':\n'));

    // Group by city for readability
    const byCity = new Map<string, typeof changes>();
    for (const c of changes) {
      const city = c.after.city || 'Unknown';
      if (!byCity.has(city)) byCity.set(city, []);
      byCity.get(city)!.push(c);
    }

    for (const [city, cityChanges] of Array.from(byCity.entries()).sort()) {
      console.log(chalk.cyan(`  ${city} (${cityChanges.length} developments):`));
      for (const c of cityChanges.slice(0, 10)) {
        const areaInfo = c.after.area ? ` → area: ${c.after.area}` : '';
        console.log(chalk.gray(`    • ${c.name}${areaInfo}`));
      }
      if (cityChanges.length > 10) {
        console.log(chalk.gray(`    ... and ${cityChanges.length - 10} more`));
      }
    }
  }

  if (dryRun) {
    console.log(chalk.yellow('\n⚠️  This was a dry run. Run without --dry-run to apply changes.\n'));
  } else {
    console.log(chalk.green('\n✅ Migration complete.\n'));
  }
}

main().catch((err) => {
  console.error(chalk.red('Migration failed:'), err);
  process.exit(1);
});
