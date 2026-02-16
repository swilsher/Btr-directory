import type { ExtractedDevelopment, ConfidenceReport, ConfidenceLevel, SourceType } from './types.js';

export function scoreConfidence(dev: ExtractedDevelopment, operatorDomain?: string): ConfidenceReport {
  let score = 0;
  const notes: string[] = [];

  const sourceTypes = new Set<SourceType>();
  for (const url of dev.sourceUrls) {
    sourceTypes.add(classifySource(url, operatorDomain));
  }

  const fromOperatorSite = operatorDomain
    ? dev.sourceUrls.some(u => u.includes(operatorDomain))
    : false;

  // Name confidence (0-0.25)
  if (dev.name && dev.name.length > 2) {
    score += 0.15;
    if (fromOperatorSite) score += 0.10;
  } else {
    notes.push('Development name is uncertain');
  }

  // Location confidence (0-0.20)
  if (dev.postcode) {
    score += 0.10;
    if (dev.region) score += 0.05;
  }
  if (dev.area) {
    score += 0.05;
  } else {
    notes.push('Area/location not confirmed');
  }

  // Units confidence (0-0.15)
  if (dev.numberOfUnits !== null) {
    score += 0.10;
    if (fromOperatorSite) score += 0.05;
  } else {
    notes.push('Unit count not confirmed');
  }

  // Status confidence (0-0.10)
  if (dev.status) {
    score += 0.07;
    if (fromOperatorSite) score += 0.03;
  } else {
    notes.push('Status not confirmed');
  }

  // Source multiplier (0-0.30)
  const sourceCount = dev.sourceUrls.length;
  if (sourceCount >= 3) {
    score += 0.20;
  } else if (sourceCount >= 2) {
    score += 0.15;
  } else if (fromOperatorSite) {
    score += 0.15;
  } else {
    score += 0.05;
    notes.push('Found in single non-operator source');
  }

  // Source type bonus
  if (sourceTypes.has('operator_website')) score += 0.05;
  if (sourceTypes.has('property_portal')) score += 0.03;
  if (sourceTypes.has('news')) score += 0.02;

  // Cap at 1.0
  score = Math.min(score, 1.0);

  const level: ConfidenceLevel = score >= 0.7 ? 'HIGH' : score >= 0.4 ? 'MEDIUM' : 'LOW';

  return {
    overall: Math.round(score * 100) / 100,
    level,
    sourceCount,
    sourceTypes: Array.from(sourceTypes),
    notes,
  };
}

function classifySource(url: string, operatorDomain?: string): SourceType {
  const lower = url.toLowerCase();

  if (operatorDomain && lower.includes(operatorDomain)) return 'operator_website';

  const propertyPortals = [
    'rightmove.co.uk', 'zoopla.co.uk', 'onthemarket.com',
    'openrent.com', 'spareroom.co.uk',
  ];
  if (propertyPortals.some(p => lower.includes(p))) return 'property_portal';

  const newsSites = [
    'btrnews.co.uk', 'urbanliving.news', 'reactnews.com',
    'egi.co.uk', 'estatesgazette.com', 'propertyweek.com',
    'placenorth.co.uk', 'insidehousing.co.uk', 'costar.com',
    'buildtorent.org.uk',
  ];
  if (newsSites.some(n => lower.includes(n))) return 'news';

  const planningSites = [
    'planningpipe.com', 'planning.', 'planningportal.',
  ];
  if (planningSites.some(p => lower.includes(p))) return 'planning';

  return 'other';
}
