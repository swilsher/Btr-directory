import * as cheerio from 'cheerio';
import type { PartialDevelopment, DevelopmentStatus, DevelopmentType, SourceType } from './types.js';
import type { ScrapedPage } from './types.js';
import { postcodeToRegion, cityToRegion } from './postcode-regions.js';
import { cleanText } from './utils.js';

// --- Regex patterns ---

const POSTCODE_REGEX = /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/gi;

const UNIT_COUNT_PATTERNS = [
  /(\d{1,4})\s*(?:new\s+)?(?:build.to.rent|BTR)\s*(?:units?|apartments?|homes?|flats?)/i,
  /(\d{1,4})\s*(?:rental\s+)?(?:units?|apartments?|homes?|flats?|residences?|dwellings?)/i,
  /(?:comprising|featuring|offering|contains?|delivering|providing|includes?)\s*(\d{1,4})\s*(?:units?|apartments?|homes?|flats?)/i,
  /(?:total\s+of|up\s+to)\s*(\d{1,4})\s*(?:units?|apartments?|homes?|flats?|residences?)/i,
  /(\d{1,4})\s*(?:one|two|three|four|1|2|3|4).?bed(?:room)?/i,
];

const COMPLETION_DATE_PATTERNS = [
  /(?:complet(?:ed?|ion)|open(?:ed|ing|s)|launch(?:ed|ing)?|deliver(?:ed|y))\s*(?:in|by|:)?\s*(?:Q([1-4])\s*)?(\d{4})/i,
  /(?:expected|due|planned|estimated|anticipated)\s*(?:completion|delivery|opening)?\s*(?:in|by|for|:)?\s*(?:Q([1-4])\s*)?(\d{4})/i,
  /(?:complet(?:ed?|ion)|opening)\s*(?:in|by|:)?\s*((?:January|February|March|April|May|June|July|August|September|October|November|December)\s*\d{4})/i,
];

const STATUS_PATTERNS: [RegExp, DevelopmentStatus][] = [
  [/\bnow\s+(?:open|leasing|letting|available|welcoming)\b/i, 'Operational'],
  [/\b(?:residents?\s+(?:are|have)\s+moved|fully\s+(?:let|leased|occupied))\b/i, 'Operational'],
  [/\b(?:move.?in|now\s+renting|available\s+to\s+rent|accepting\s+(?:tenants|applications))\b/i, 'Operational'],
  [/\b(?:currently\s+)?under\s+construction\b/i, 'Under Construction'],
  [/\b(?:construction\s+(?:has\s+)?(?:started|begun|commenced|underway))\b/i, 'Under Construction'],
  [/\b(?:being\s+built|building\s+work|on\s*site)\b/i, 'Under Construction'],
  [/\b(?:planning\s+(?:permission|application|approved|submitted|consent))\b/i, 'In Planning'],
  [/\b(?:proposed|pre.?planning|outline\s+planning)\b/i, 'In Planning'],
];

const ASSET_OWNER_PATTERNS = [
  /(?:owned\s+by|asset\s+owner|backed\s+by|funded\s+by|invested?\s+(?:in\s+)?by|acquired\s+by)\s+([A-Z][A-Za-z\s&.']+?)(?:\.|,|\s+(?:and|has|have|is|was|which|who|in|for|with|to))/i,
  /([A-Z][A-Za-z\s&.']+?)\s+(?:owns?|acquired|invested\s+in|funded|backs?)\s+(?:the\s+)?/i,
  /(?:developed\s+by\s+[A-Za-z\s&.']+?\s+for)\s+([A-Z][A-Za-z\s&.']+)/i,
];

const AMENITY_KEYWORDS: Record<string, string> = {
  'amenity_gym': 'gym|fitness|exercise room|workout|fitness suite',
  'amenity_pool': 'pool|swimming',
  'amenity_coworking': 'co.?working|cowork|work.?space|business lounge|working from home suite',
  'amenity_concierge': 'concierge|reception|doorman|24.?hour.?(?:reception|desk)',
  'amenity_cinema': 'cinema|screening room|movie room|theatre room|private cinema',
  'amenity_roof_terrace': 'roof.?(?:top|terrace)|sky.?(?:lounge|terrace|garden)|rooftop',
  'amenity_bike_storage': 'bike|bicycle|cycle storage|cycling',
  'amenity_pet_facilities': 'pet.?(?:spa|wash|facility|grooming)|dog wash|dog grooming',
  'amenity_ev_charging': 'ev.?charg|electric vehicle|charge point',
  'amenity_parcel_room': 'parcel|package room|post room|delivery room',
  'amenity_guest_suites': 'guest suite|visitor suite|guest room|guest apartment',
  'amenity_playground': 'playground|play area|children',
};

// --- Main extraction ---

export function extractFromPage(
  page: ScrapedPage,
  operatorName: string,
  operatorDomain: string | undefined,
  defaultType: DevelopmentType
): PartialDevelopment[] {
  const $ = cheerio.load(page.html);
  // Remove noise
  $('script, style, nav, footer, header, .cookie-banner, .cookie-consent, noscript').remove();

  const bodyText = cleanText($.text());
  const sourceType = classifyPageSource(page.url, operatorDomain);

  // Try portfolio page extraction first (multiple developments from one page)
  const portfolioResults = extractFromPortfolioPage($, bodyText, page.url, operatorName, sourceType, defaultType);
  if (portfolioResults.length >= 2) {
    return portfolioResults;
  }

  // Fall back to single development extraction
  const single = extractSingleDevelopment($, bodyText, page, operatorName, sourceType, defaultType);
  if (single) {
    return [single];
  }

  return [];
}

function extractFromPortfolioPage(
  $: cheerio.CheerioAPI,
  bodyText: string,
  pageUrl: string,
  operatorName: string,
  sourceType: SourceType,
  defaultType: DevelopmentType
): PartialDevelopment[] {
  const developments: PartialDevelopment[] = [];

  // Try common card/listing selectors
  const cardSelectors = [
    '.property-card', '.development-card', '.location-card',
    '[class*="property-card"]', '[class*="development-card"]', '[class*="location-card"]',
    '[class*="PropertyCard"]', '[class*="DevelopmentCard"]', '[class*="LocationCard"]',
    'article[class*="card"]', '.card',
    '[class*="listing-item"]', '[class*="grid-item"]',
  ];

  for (const selector of cardSelectors) {
    const cards = $(selector);
    if (cards.length >= 2) {
      cards.each((_i, el) => {
        const card = $(el);
        const rawName = card.find('h2, h3, h4, .title, [class*="name"], [class*="title"]').first().text().trim();
        const name = cleanName(rawName);
        const locationText = card.find('[class*="location"], [class*="address"], .subtitle, [class*="area"]').text().trim();
        const link = card.find('a').attr('href');

        if (name && name.length > 2 && name.length < 100) {
          const fullUrl = link ? resolveUrl(link, pageUrl) : undefined;
          const postcode = extractFirstPostcode(locationText + ' ' + name);
          const region = postcode ? postcodeToRegion(postcode) : cityToRegion(locationText);

          developments.push({
            name,
            area: locationText || undefined,
            postcode: postcode || undefined,
            region: region || undefined,
            websiteUrl: fullUrl,
            operator: operatorName,
            developmentType: defaultType,
            sourceUrl: pageUrl,
            sourceType,
          });
        }
      });

      if (developments.length > 0) break;
    }
  }

  // Fallback: look for repeated heading + link patterns
  if (developments.length === 0) {
    const links = $('a');
    const seen = new Set<string>();

    links.each((_i, el) => {
      const $a = $(el);
      const href = $a.attr('href') || '';
      const text = $a.text().trim();

      // Skip navigation/generic links
      if (!text || text.length < 3 || text.length > 80) return;
      if (/^(home|about|contact|blog|news|login|sign)/i.test(text)) return;
      if (seen.has(text.toLowerCase())) return;

      // Check if link looks like a development page
      const hrefLower = href.toLowerCase();
      if (
        hrefLower.includes('/development') ||
        hrefLower.includes('/location') ||
        hrefLower.includes('/neighbourhood') ||
        hrefLower.includes('/property') ||
        hrefLower.includes('/homes/') ||
        hrefLower.includes('/places/')
      ) {
        seen.add(text.toLowerCase());
        const fullUrl = resolveUrl(href, pageUrl);
        developments.push({
          name: cleanName(text),
          websiteUrl: fullUrl,
          operator: operatorName,
          developmentType: defaultType,
          sourceUrl: pageUrl,
          sourceType,
        });
      }
    });
  }

  return developments;
}

function extractSingleDevelopment(
  $: cheerio.CheerioAPI,
  bodyText: string,
  page: ScrapedPage,
  operatorName: string,
  sourceType: SourceType,
  defaultType: DevelopmentType
): PartialDevelopment | null {
  // Extract name from h1 or title
  const h1 = $('h1').first().text().trim();
  const titleTag = $('title').text().trim();
  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim();

  let name = cleanName(h1 || ogTitle || titleTag || '');
  if (!name || name.length < 3) return null;

  // Extract fields
  const postcode = extractFirstPostcode(bodyText);
  const area = extractArea($, bodyText);
  const region = postcode
    ? postcodeToRegion(postcode)
    : area ? cityToRegion(area) : undefined;
  const numberOfUnits = extractUnitCount(bodyText);
  const status = inferStatus(bodyText);
  const completionDate = extractCompletionDate(bodyText);
  const description = extractDescription($);
  const amenities = extractAmenities(bodyText);
  const petsAllowed = /\bpets?\s*(?:allowed|welcome|friendly)\b/i.test(bodyText);
  const assetOwner = extractAssetOwner(bodyText, operatorName);
  const devType = inferDevelopmentType(bodyText, defaultType);

  return {
    name,
    area,
    region,
    postcode: postcode || undefined,
    numberOfUnits,
    status,
    completionDate: completionDate || undefined,
    description: description || undefined,
    websiteUrl: page.url,
    operator: operatorName,
    assetOwner,
    developmentType: devType,
    amenities,
    petsAllowed,
    sourceUrl: page.url,
    sourceType,
  };
}

// --- Field extractors ---

function extractFirstPostcode(text: string): string | null {
  const match = text.match(POSTCODE_REGEX);
  return match ? match[0].toUpperCase().replace(/\s+/g, ' ') : null;
}

function extractArea($: cheerio.CheerioAPI, bodyText: string): string | undefined {
  // Try meta tags first
  const ogLocality = $('meta[property="og:locality"]').attr('content')?.trim();
  if (ogLocality) return ogLocality;

  // Try address-like elements
  const addressEl = $('address, [class*="address"], [class*="location"], [itemprop="address"]').first().text().trim();
  if (addressEl && addressEl.length < 100) {
    // Extract city/town from address (usually after the first comma or last part)
    const parts = addressEl.split(',').map(s => s.trim());
    if (parts.length >= 2) {
      return parts[parts.length - 2] || parts[0];
    }
    return addressEl;
  }

  return undefined;
}

function extractUnitCount(text: string): number | null {
  for (const pattern of UNIT_COUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      // The unit count could be in group 1 or 2 depending on the pattern
      const numStr = match[2] || match[1];
      const num = parseInt(numStr, 10);
      if (num > 0 && num < 5000) return num;
    }
  }
  return null;
}

function inferStatus(text: string): DevelopmentStatus | null {
  for (const [pattern, status] of STATUS_PATTERNS) {
    if (pattern.test(text)) return status;
  }
  return null;
}

function extractCompletionDate(text: string): string | null {
  for (const pattern of COMPLETION_DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      // Handle "Month Year" format
      if (match[1] && /[A-Za-z]/.test(match[1])) {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
      // Handle "Q1 2025" or just "2025"
      const quarter = match[1] ? parseInt(match[1]) : undefined;
      const year = match[2] || match[1];
      if (year && /^\d{4}$/.test(year)) {
        const y = parseInt(year);
        if (y >= 2015 && y <= 2035) {
          if (quarter) {
            const month = ((quarter - 1) * 3 + 1).toString().padStart(2, '0');
            return `${y}-${month}-01`;
          }
          return `${y}-01-01`;
        }
      }
    }
  }
  return null;
}

function extractDescription($: cheerio.CheerioAPI): string | null {
  // Try meta description first
  const metaDesc = $('meta[name="description"]').attr('content')?.trim();
  if (metaDesc && metaDesc.length > 20) return metaDesc.substring(0, 300);

  const ogDesc = $('meta[property="og:description"]').attr('content')?.trim();
  if (ogDesc && ogDesc.length > 20) return ogDesc.substring(0, 300);

  // Try first substantial paragraph
  const paragraphs = $('p');
  for (let i = 0; i < paragraphs.length && i < 10; i++) {
    const text = $(paragraphs[i]).text().trim();
    if (text.length > 50 && text.length < 500) {
      return text.substring(0, 300);
    }
  }

  return null;
}

function extractAmenities(text: string): Record<string, boolean> {
  const amenities: Record<string, boolean> = {};
  for (const [field, pattern] of Object.entries(AMENITY_KEYWORDS)) {
    amenities[field] = new RegExp(pattern, 'i').test(text);
  }
  return amenities;
}

function extractAssetOwner(text: string, operatorName: string): string | undefined {
  for (const pattern of ASSET_OWNER_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const owner = match[1].trim();
      // Skip if it's the operator name itself, or too short/long
      if (
        owner.toLowerCase() !== operatorName.toLowerCase() &&
        owner.length > 2 &&
        owner.length < 60
      ) {
        return owner;
      }
    }
  }
  return undefined;
}

function inferDevelopmentType(text: string, defaultType: DevelopmentType): DevelopmentType {
  const lower = text.toLowerCase();
  const houseKeywords = /\b(?:houses?|bungalows?|semi.?detached|detached|terraced|townhouse|single.?family)\b/i;
  const flatKeywords = /\b(?:apartments?|flats?|studio|penthouse|multifamily|tower|high.?rise)\b/i;

  const houseScore = (lower.match(houseKeywords) || []).length;
  const flatScore = (lower.match(flatKeywords) || []).length;

  if (houseScore > flatScore + 1) return 'Single Family';
  if (flatScore > houseScore + 1) return 'Multifamily';
  return defaultType;
}

// --- Name cleaning ---

function cleanName(raw: string): string {
  return raw
    // Remove accessibility text artifacts
    .replace(/opens?\s*in\s*a?\s*new\s*(?:tab|window)/gi, '')
    // Remove trailing " | Brand Name" patterns
    .replace(/\s*[|–—]\s*[^|–—]+$/, '')
    // Remove "View details" / "Read more" / "Learn more" type suffixes
    .replace(/\s*(?:view|read|learn|find out)\s*(?:more|details)\.?$/gi, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// --- Helpers ---

function classifyPageSource(url: string, operatorDomain?: string): SourceType {
  const lower = url.toLowerCase();
  if (operatorDomain && lower.includes(operatorDomain)) return 'operator_website';

  const portals = ['rightmove', 'zoopla', 'onthemarket', 'openrent'];
  if (portals.some(p => lower.includes(p))) return 'property_portal';

  const news = ['btrnews', 'urbanliving', 'reactnews', 'egi.co', 'estatesgazette', 'propertyweek', 'costar'];
  if (news.some(n => lower.includes(n))) return 'news';

  const planning = ['planningpipe', 'planning.'];
  if (planning.some(p => lower.includes(p))) return 'planning';

  return 'other';
}

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}
