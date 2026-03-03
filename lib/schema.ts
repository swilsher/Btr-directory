import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants';

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/og-image.jpg`,
    description: SITE_DESCRIPTION,
    sameAs: [],
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/multifamily?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

interface DevelopmentSchemaInput {
  name: string;
  description?: string | null;
  city?: string | null;
  area?: string | null;
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
  number_of_units?: number | null;
  slug: string;
  amenities: string[];
}

export function developmentPlaceSchema(dev: DevelopmentSchemaInput) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: dev.name,
    url: `${SITE_URL}/development/${dev.slug}`,
  };

  if (dev.description) {
    schema.description = dev.description;
  }

  if (dev.image_url) {
    schema.image = dev.image_url;
  }

  if (dev.city || dev.area || dev.region) {
    schema.address = {
      '@type': 'PostalAddress',
      ...(dev.city && { addressLocality: dev.city }),
      ...(dev.area && !dev.city && { addressLocality: dev.area }),
      ...(dev.region && { addressRegion: dev.region }),
      addressCountry: 'GB',
    };
  }

  if (dev.latitude && dev.longitude) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: dev.latitude,
      longitude: dev.longitude,
    };
  }

  if (dev.number_of_units) {
    schema.maximumAttendeeCapacity = dev.number_of_units;
  }

  if (dev.amenities.length > 0) {
    schema.amenityFeature = dev.amenities.map((name) => ({
      '@type': 'LocationFeatureSpecification',
      name,
      value: true,
    }));
  }

  return schema;
}

interface ItemListInput {
  name: string;
  url: string;
}

export function itemListSchema(items: ItemListInput[], listName: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 50).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

interface ArticleSchemaInput {
  title: string;
  description?: string | null;
  url: string;
  imageUrl?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  categoryName?: string | null;
}

export function articleSchema(article: ArticleSchemaInput) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    url: article.url,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/og-image.jpg`,
      },
    },
  };

  if (article.description) {
    schema.description = article.description;
  }

  if (article.imageUrl) {
    schema.image = article.imageUrl;
  }

  if (article.publishedAt) {
    schema.datePublished = article.publishedAt;
  }

  if (article.updatedAt) {
    schema.dateModified = article.updatedAt;
  }

  if (article.categoryName) {
    schema.articleSection = article.categoryName;
  }

  return schema;
}
