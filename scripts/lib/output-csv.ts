import { stringify } from 'csv-stringify/sync';
import type { ExtractedDevelopment } from './types.js';

const CSV_COLUMNS = [
  'confidence',
  'name',
  'slug',
  'development_type',
  'area',
  'region',
  'postcode',
  'number_of_units',
  'status',
  'completion_date',
  'description',
  'website_url',
  'asset_owner',
  'operator',
  'source_urls',
  'notes',
];

export function generateCSV(developments: ExtractedDevelopment[]): string {
  const records = developments.map(dev => ({
    confidence: dev.confidence.level,
    name: dev.name,
    slug: dev.slug,
    development_type: dev.developmentType,
    area: dev.area,
    region: dev.region,
    postcode: dev.postcode,
    number_of_units: dev.numberOfUnits ?? '',
    status: dev.status ?? '',
    completion_date: dev.completionDate,
    description: dev.description.substring(0, 200),
    website_url: dev.websiteUrl,
    asset_owner: dev.assetOwner,
    operator: dev.operator,
    source_urls: dev.sourceUrls.join(' | '),
    notes: dev.extractionNotes.join('; '),
  }));

  return stringify(records, {
    header: true,
    columns: CSV_COLUMNS,
  });
}
