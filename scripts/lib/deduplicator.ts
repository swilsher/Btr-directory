import type { PartialDevelopment, ExtractedDevelopment, DevelopmentType, DevelopmentStatus } from './types.js';
import { generateSlug } from './utils.js';
import { scoreConfidence } from './confidence.js';

const SOURCE_PRIORITY: Record<string, number> = {
  'operator_website': 0,
  'property_portal': 1,
  'news': 2,
  'planning': 3,
  'other': 4,
};

export function deduplicateAndMerge(
  partials: PartialDevelopment[],
  operatorName: string,
  defaultType: DevelopmentType,
  operatorDomain?: string,
): ExtractedDevelopment[] {
  const groups = new Map<string, PartialDevelopment[]>();

  for (const dev of partials) {
    if (!dev.name || dev.name.length < 2) continue;

    const slug = generateSlug(dev.name);
    const matchKey = findMatchKey(groups, slug, dev.name);

    if (matchKey) {
      groups.get(matchKey)!.push(dev);
    } else {
      groups.set(slug, [dev]);
    }
  }

  // Resolve slug collisions (same slug, different areas)
  const slugCounts = new Map<string, number>();
  const results: ExtractedDevelopment[] = [];

  for (const [baseSlug, group] of groups) {
    const merged = mergeGroup(group, operatorName, defaultType);

    // Handle slug collision by appending area
    let finalSlug = baseSlug;
    const count = slugCounts.get(baseSlug) || 0;
    if (count > 0 && merged.area) {
      finalSlug = `${baseSlug}-${generateSlug(merged.area)}`;
    }
    slugCounts.set(baseSlug, count + 1);

    merged.slug = finalSlug;
    merged.confidence = scoreConfidence(merged, operatorDomain);
    results.push(merged);
  }

  // Sort by confidence (highest first)
  results.sort((a, b) => b.confidence.overall - a.confidence.overall);

  return results;
}

function findMatchKey(
  groups: Map<string, PartialDevelopment[]>,
  candidateSlug: string,
  candidateName: string
): string | null {
  // Exact slug match
  if (groups.has(candidateSlug)) return candidateSlug;

  // Fuzzy name match
  const normalizedCandidate = candidateName.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const [key, group] of groups) {
    const existingName = group[0].name.toLowerCase().replace(/[^a-z0-9]/g, '');

    // One contains the other
    if (
      normalizedCandidate.includes(existingName) ||
      existingName.includes(normalizedCandidate)
    ) {
      return key;
    }

    // Very similar slugs (differ by <=2 chars at the end, e.g. "the-forge" vs "the-forges")
    if (
      candidateSlug.length > 5 &&
      key.length > 5 &&
      (candidateSlug.startsWith(key) || key.startsWith(candidateSlug))
    ) {
      const diff = Math.abs(candidateSlug.length - key.length);
      if (diff <= 2) return key;
    }
  }

  return null;
}

function mergeGroup(
  group: PartialDevelopment[],
  operatorName: string,
  defaultType: DevelopmentType
): ExtractedDevelopment {
  // Sort by source priority (operator_website first)
  const sorted = [...group].sort(
    (a, b) => (SOURCE_PRIORITY[a.sourceType] ?? 4) - (SOURCE_PRIORITY[b.sourceType] ?? 4)
  );

  const sourceUrls = [...new Set(group.map(d => d.sourceUrl))];
  const notes: string[] = [];

  // Pick best value for each field
  const name = pickBestString(sorted.map(d => d.name))!;
  const area = pickBestString(sorted.map(d => d.area));
  const region = pickBestString(sorted.map(d => d.region));
  const postcode = pickBestString(sorted.map(d => d.postcode));
  const websiteUrl = pickBestString(sorted.map(d => d.websiteUrl));
  const description = pickBestString(sorted.map(d => d.description));
  const assetOwner = pickBestString(sorted.map(d => d.assetOwner));
  const completionDate = pickBestString(sorted.map(d => d.completionDate));

  // Pick best numeric value (prefer non-null from higher-priority source)
  const numberOfUnits = pickBestNumber(sorted.map(d => d.numberOfUnits));

  // Pick status (prefer explicit from higher-priority source)
  const status = pickBestStatus(sorted.map(d => d.status));

  // Pick development type
  const devType = pickBestDevType(sorted.map(d => d.developmentType), defaultType);

  // Merge amenities (OR across all sources)
  const amenities: Record<string, boolean> = {};
  for (const dev of sorted) {
    if (dev.amenities) {
      for (const [key, val] of Object.entries(dev.amenities)) {
        if (val) amenities[key] = true;
      }
    }
  }

  // Pets allowed (OR)
  const petsAllowed = sorted.some(d => d.petsAllowed);

  // Year completed
  let yearCompleted: number | null = null;
  if (completionDate) {
    const year = parseInt(completionDate.substring(0, 4));
    if (year >= 2015 && year <= 2035) yearCompleted = year;
  }

  // Add notes for data quality
  if (!numberOfUnits) notes.push('Unit count not confirmed');
  if (!status) notes.push('Status not confirmed');
  if (!postcode) notes.push('Postcode not found');
  if (!region) notes.push('Region could not be determined');
  if (group.length > 1) {
    const uniqueUnitCounts = [...new Set(group.map(d => d.numberOfUnits).filter(Boolean))];
    if (uniqueUnitCounts.length > 1) {
      notes.push(`Conflicting unit counts: ${uniqueUnitCounts.join(', ')}`);
    }
  }

  return {
    name,
    slug: '', // will be set by caller
    developmentType: devType,
    area: area || '',
    region: region || '',
    postcode: postcode || '',
    numberOfUnits: numberOfUnits ?? null,
    status: status ?? null,
    completionDate: completionDate || '',
    yearCompleted,
    description: description || '',
    websiteUrl: websiteUrl || '',
    assetOwner: assetOwner || operatorName,
    operator: operatorName,
    amenities,
    petsAllowed,
    confidence: {
      overall: 0,
      level: 'LOW',
      sourceCount: sourceUrls.length,
      sourceTypes: [],
      notes: [],
    },
    sourceUrls,
    extractionNotes: notes,
  };
}

function pickBestString(values: (string | undefined)[]): string | undefined {
  for (const v of values) {
    if (v && v.trim().length > 0) return v.trim();
  }
  return undefined;
}

function pickBestNumber(values: (number | undefined | null)[]): number | null {
  for (const v of values) {
    if (v !== undefined && v !== null && v > 0) return v;
  }
  return null;
}

function pickBestStatus(values: (DevelopmentStatus | undefined | null)[]): DevelopmentStatus | null {
  for (const v of values) {
    if (v) return v;
  }
  return null;
}

function pickBestDevType(values: (DevelopmentType | undefined)[], defaultType: DevelopmentType): DevelopmentType {
  for (const v of values) {
    if (v) return v;
  }
  return defaultType;
}
