import type { ExtractedDevelopment } from './types.js';
import { generateSlug, sqlString, sqlBool, sqlInt, sqlDate } from './utils.js';

export function generateSQL(
  developments: ExtractedDevelopment[],
  operatorName: string,
  operatorWebsite?: string
): string {
  const operatorSlug = generateSlug(operatorName);
  const now = new Date().toISOString().split('T')[0];

  // Only include MEDIUM+ confidence
  const included = developments.filter(d => d.confidence.level !== 'LOW');
  const excluded = developments.filter(d => d.confidence.level === 'LOW');

  // Collect unique asset owners (that differ from operator)
  const assetOwners = new Set<string>();
  for (const dev of included) {
    if (dev.assetOwner && dev.assetOwner.toLowerCase() !== operatorName.toLowerCase()) {
      assetOwners.add(dev.assetOwner);
    }
  }

  const lines: string[] = [];

  // Header
  lines.push(`-- ============================================================================`);
  lines.push(`-- BTR Directory Data Upload: ${operatorName}`);
  lines.push(`-- Generated: ${now}`);
  lines.push(`-- REVIEW STATUS: PENDING MANUAL CHECK`);
  lines.push(`-- Total developments found: ${developments.length}`);
  lines.push(`-- Included in SQL (MEDIUM+ confidence): ${included.length}`);
  lines.push(`-- Excluded (LOW confidence, review CSV): ${excluded.length}`);
  lines.push(`-- ============================================================================`);
  lines.push('');

  // Step 1: Insert operator
  lines.push(`-- Step 1: Insert operator (if not already in database)`);
  lines.push(`INSERT INTO operators (name, slug, website, description)`);
  lines.push(`SELECT ${sqlString(operatorName)}, ${sqlString(operatorSlug)}, ${sqlString(operatorWebsite)}, ${sqlString(`BTR operator`)}`);
  lines.push(`WHERE NOT EXISTS (SELECT 1 FROM operators WHERE slug = ${sqlString(operatorSlug)});`);
  lines.push('');

  // Step 2: Insert asset owners
  if (assetOwners.size > 0) {
    lines.push(`-- Step 2: Insert asset owners (if not already in database)`);
    for (const aoName of assetOwners) {
      const aoSlug = generateSlug(aoName);
      lines.push(`INSERT INTO asset_owners (name, slug)`);
      lines.push(`SELECT ${sqlString(aoName)}, ${sqlString(aoSlug)}`);
      lines.push(`WHERE NOT EXISTS (SELECT 1 FROM asset_owners WHERE slug = ${sqlString(aoSlug)});`);
      lines.push('');
    }
  }

  // Step 3: Insert developments using DO block
  lines.push(`-- Step 3: Insert developments`);
  lines.push(`DO $$`);
  lines.push(`DECLARE`);
  lines.push(`  op_id UUID;`);
  if (assetOwners.size > 0) {
    lines.push(`  ao_id UUID;`);
  }
  lines.push(`BEGIN`);
  lines.push(`  SELECT id INTO op_id FROM operators WHERE slug = ${sqlString(operatorSlug)};`);
  lines.push('');

  for (const dev of included) {
    const sameOwner = !dev.assetOwner || dev.assetOwner.toLowerCase() === operatorName.toLowerCase();
    const aoSlug = sameOwner ? null : generateSlug(dev.assetOwner);

    lines.push(`  -- DEVELOPMENT: ${dev.name}`);
    lines.push(`  -- Confidence: ${dev.confidence.level} (${dev.confidence.overall})`);
    lines.push(`  -- Sources: ${dev.sourceUrls.join(', ')}`);
    if (dev.extractionNotes.length > 0) {
      lines.push(`  -- Notes: ${dev.extractionNotes.join('; ')}`);
    }

    if (aoSlug) {
      lines.push(`  SELECT id INTO ao_id FROM asset_owners WHERE slug = ${sqlString(aoSlug)};`);
    }

    lines.push(`  INSERT INTO developments (`);
    lines.push(`    name, slug, development_type, operator_id, asset_owner_id,`);
    lines.push(`    area, region, postcode,`);
    lines.push(`    number_of_units, status, completion_date,`);
    lines.push(`    description, website_url,`);
    lines.push(`    amenity_gym, amenity_pool, amenity_coworking, amenity_concierge,`);
    lines.push(`    amenity_cinema, amenity_roof_terrace, amenity_bike_storage,`);
    lines.push(`    amenity_pet_facilities, amenity_ev_charging, amenity_parcel_room,`);
    lines.push(`    amenity_guest_suites, amenity_playground,`);
    lines.push(`    pets_allowed, is_published, flagged_for_review`);
    lines.push(`  )`);
    lines.push(`  SELECT`);
    lines.push(`    ${sqlString(dev.name)}, ${sqlString(dev.slug)}, ${sqlString(dev.developmentType)}, op_id, ${sameOwner ? 'op_id' : 'ao_id'},`);
    lines.push(`    ${sqlString(dev.area)}, ${sqlString(dev.region)}, ${sqlString(dev.postcode)},`);
    lines.push(`    ${sqlInt(dev.numberOfUnits)}, ${sqlString(dev.status)}, ${sqlDate(dev.completionDate)},`);
    lines.push(`    ${sqlString(dev.description.substring(0, 500))}, ${sqlString(dev.websiteUrl)},`);
    lines.push(`    ${sqlBool(dev.amenities.amenity_gym)}, ${sqlBool(dev.amenities.amenity_pool)}, ${sqlBool(dev.amenities.amenity_coworking)}, ${sqlBool(dev.amenities.amenity_concierge)},`);
    lines.push(`    ${sqlBool(dev.amenities.amenity_cinema)}, ${sqlBool(dev.amenities.amenity_roof_terrace)}, ${sqlBool(dev.amenities.amenity_bike_storage)},`);
    lines.push(`    ${sqlBool(dev.amenities.amenity_pet_facilities)}, ${sqlBool(dev.amenities.amenity_ev_charging)}, ${sqlBool(dev.amenities.amenity_parcel_room)},`);
    lines.push(`    ${sqlBool(dev.amenities.amenity_guest_suites)}, ${sqlBool(dev.amenities.amenity_playground)},`);
    lines.push(`    ${sqlBool(dev.petsAllowed)}, true, ${sqlBool(dev.confidence.level === 'MEDIUM')}`);
    lines.push(`  WHERE NOT EXISTS (`);
    lines.push(`    SELECT 1 FROM developments WHERE slug = ${sqlString(dev.slug)}`);
    lines.push(`  );`);
    lines.push('');
  }

  lines.push(`END $$;`);
  lines.push('');

  // Summary comment
  lines.push(`-- ============================================================================`);
  lines.push(`-- Summary`);
  lines.push(`-- ============================================================================`);
  for (const dev of included) {
    const flag = dev.confidence.level === 'MEDIUM' ? ' [FLAGGED FOR REVIEW]' : '';
    lines.push(`-- ${dev.confidence.level}: ${dev.name} (${dev.area || 'unknown area'})${flag}`);
  }
  if (excluded.length > 0) {
    lines.push(`--`);
    lines.push(`-- LOW confidence (not included - review CSV):`);
    for (const dev of excluded) {
      lines.push(`--   ${dev.name} (${dev.extractionNotes.join('; ')})`);
    }
  }

  return lines.join('\n');
}
