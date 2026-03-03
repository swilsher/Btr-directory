import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import JsonLd from '@/components/seo/JsonLd';
import CityGrid from '@/components/cities/CityGrid';
import { itemListSchema } from '@/lib/schema';
import { SITE_URL } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { generateSlug } from '@/lib/utils';
import { cityToRegion } from '@/lib/postcode-utils';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Browse BTR Developments by City',
  description: 'Explore Build to Rent developments across UK cities. Find BTR properties in London, Manchester, Birmingham, Leeds, and more.',
  alternates: {
    canonical: `${SITE_URL}/cities`,
  },
};

const REGIONS = [
  'London',
  'South East',
  'South West',
  'East of England',
  'East Midlands',
  'West Midlands',
  'North West',
  'North East',
  'Yorkshire and The Humber',
  'Scotland',
  'Wales',
];

export default async function CitiesPage() {
  // Fetch city, area, and region for all published developments
  const { data: developments } = await supabase
    .from('developments')
    .select('city, area, region')
    .eq('is_published', true)
    .not('city', 'is', null);

  // Group by city — track count, region, and which cities have sub-areas
  const cityMap = new Map<string, { count: number; region: string; areas: Set<string> }>();

  (developments || []).forEach((dev) => {
    if (!dev.city) return;

    const existing = cityMap.get(dev.city);
    if (existing) {
      existing.count++;
      if (dev.area) existing.areas.add(dev.area);
      // Prefer a non-empty region if the current one is blank
      if (!existing.region && dev.region) existing.region = dev.region;
    } else {
      const areas = new Set<string>();
      if (dev.area) areas.add(dev.area);
      cityMap.set(dev.city, {
        count: 1,
        region: dev.region || '',
        areas,
      });
    }
  });

  // Convert to sorted array (by count descending)
  // Use cityToRegion() when DB region is missing or not a valid filter (e.g. "England")
  const regionSet = new Set(REGIONS);
  const cities = Array.from(cityMap.entries())
    .map(([name, data]) => {
      const dbRegionValid = data.region && regionSet.has(data.region);
      return {
        name,
        slug: generateSlug(name),
        region: dbRegionValid ? data.region : (cityToRegion(name) || data.region || ''),
        count: data.count,
        hasAreas: data.areas.size > 1,
      };
    })
    .sort((a, b) => b.count - a.count);

  const listSchema = itemListSchema(
    cities.map((city) => ({ name: city.name, url: `${SITE_URL}/cities/${city.slug}` })),
    'UK BTR Cities'
  );

  return (
    <>
      <JsonLd data={listSchema} />
      <Header />
      <main className="min-h-screen bg-background">
        <section className="bg-gradient-to-br from-primary-blue to-white text-white py-12">
          <div className="container-custom">
            <h1 className="text-4xl font-semibold mb-3 tracking-normal">Browse by City</h1>
            <p className="text-xl font-medium opacity-95">
              Explore {cities.length} cities with Build to Rent developments across the UK
            </p>
          </div>
        </section>

        <div className="container-custom py-8">
          <CityGrid cities={cities} regions={REGIONS} />
        </div>
      </main>
      <Footer />
    </>
  );
}
