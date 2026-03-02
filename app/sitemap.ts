import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { SITE_URL } from '@/lib/constants';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/multifamily`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/single-family`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/operators`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/suppliers`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/insights`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/map`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/asset-owners`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
  ];

  // Development pages
  const { data: developments } = await supabase
    .from('developments')
    .select('slug, updated_at')
    .eq('is_published', true);

  const developmentPages: MetadataRoute.Sitemap = (developments || []).map((dev) => ({
    url: `${SITE_URL}/development/${dev.slug}`,
    lastModified: dev.updated_at ? new Date(dev.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Operator pages
  const { data: operators } = await supabase.from('operators').select('slug');
  const operatorPages: MetadataRoute.Sitemap = (operators || []).map((op) => ({
    url: `${SITE_URL}/operators/${op.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Supplier pages
  const { data: suppliers } = await supabase.from('suppliers').select('slug');
  const supplierPages: MetadataRoute.Sitemap = (suppliers || []).map((s) => ({
    url: `${SITE_URL}/suppliers/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  // Insight/blog pages
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('is_published', true);

  const insightPages: MetadataRoute.Sitemap = (posts || []).map((p) => ({
    url: `${SITE_URL}/insights/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Asset owner pages
  const { data: assetOwners } = await supabase.from('asset_owners').select('slug');
  const assetOwnerPages: MetadataRoute.Sitemap = (assetOwners || []).map((ao) => ({
    url: `${SITE_URL}/asset-owners/${ao.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [
    ...staticPages,
    ...developmentPages,
    ...operatorPages,
    ...supplierPages,
    ...insightPages,
    ...assetOwnerPages,
  ];
}
