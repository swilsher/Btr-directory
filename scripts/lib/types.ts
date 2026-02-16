export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: 'serpapi' | 'manual';
  query?: string;
}

export interface ScrapedPage {
  url: string;
  title: string;
  bodyText: string;
  html: string;
  method: 'static' | 'dynamic';
  error?: string;
}

export type DevelopmentType = 'Multifamily' | 'Single Family';
export type DevelopmentStatus = 'In Planning' | 'Under Construction' | 'Operational';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type SourceType = 'operator_website' | 'property_portal' | 'news' | 'planning' | 'other';

export interface PartialDevelopment {
  name: string;
  slug?: string;
  developmentType?: DevelopmentType;
  area?: string;
  region?: string;
  postcode?: string;
  numberOfUnits?: number;
  status?: DevelopmentStatus;
  completionDate?: string;
  yearCompleted?: number;
  description?: string;
  websiteUrl?: string;
  assetOwner?: string;
  operator?: string;
  amenities?: Record<string, boolean>;
  petsAllowed?: boolean;
  sourceUrl: string;
  sourceType: SourceType;
}

export interface ConfidenceReport {
  overall: number;
  level: ConfidenceLevel;
  sourceCount: number;
  sourceTypes: SourceType[];
  notes: string[];
}

export interface ExtractedDevelopment {
  name: string;
  slug: string;
  developmentType: DevelopmentType;
  area: string;
  region: string;
  postcode: string;
  numberOfUnits: number | null;
  status: DevelopmentStatus | null;
  completionDate: string;
  yearCompleted: number | null;
  description: string;
  websiteUrl: string;
  assetOwner: string;
  operator: string;
  amenities: Record<string, boolean>;
  petsAllowed: boolean;
  confidence: ConfidenceReport;
  sourceUrls: string[];
  extractionNotes: string[];
}

export interface CLIOptions {
  operator: string;
  website?: string;
  urls?: string;
  interactive?: boolean;
  outputDir: string;
  noPlaywright?: boolean;
  type: DevelopmentType;
  maxResults: number;
}

export interface ResearchConfig {
  operatorName: string;
  operatorSlug: string;
  operatorWebsite?: string;
  operatorDomain?: string;
  defaultType: DevelopmentType;
  maxResults: number;
  usePlaywright: boolean;
}
