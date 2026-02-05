export interface SanityImage {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
  alt?: string;
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
}

export interface SanitySlug {
  _type: 'slug';
  current: string;
}

export interface Category {
  _id: string;
  title: string;
  slug: SanitySlug;
  description?: string;
}

export interface Tag {
  _id: string;
  title: string;
  slug: SanitySlug;
}

export type ContentType = 'blog' | 'case-study' | 'market-report';

export interface InsightPost {
  _id: string;
  title: string;
  slug: SanitySlug;
  contentType: ContentType;
  excerpt?: string;
  mainImage?: SanityImage;
  body?: any[]; // Portable Text blocks
  publishedAt: string;
  featured?: boolean;
  category: Category;
  tags?: Tag[];
}

export interface InsightPostSummary {
  _id: string;
  title: string;
  slug: SanitySlug;
  contentType: ContentType;
  excerpt?: string;
  mainImage?: SanityImage;
  publishedAt: string;
  featured?: boolean;
  category: Category;
  tags?: Tag[];
}

// Helper type for content type labels
export const contentTypeLabels: Record<ContentType, string> = {
  'blog': 'Blog Post',
  'case-study': 'Case Study',
  'market-report': 'Market Report',
};

// Helper type for content type colors (matching existing Badge variants)
export const contentTypeColors: Record<ContentType, string> = {
  'blog': 'bg-blue-50 text-primary-blue',
  'case-study': 'bg-green-100 text-green-700',
  'market-report': 'bg-orange-100 text-orange-700',
};
