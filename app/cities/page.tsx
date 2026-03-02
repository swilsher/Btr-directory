import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import JsonLd from '@/components/seo/JsonLd';
import { itemListSchema } from '@/lib/schema';
import { SITE_URL, SITE_NAME } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { generateSlug } from '@/lib/utils';
import Link from 'next/link';
import { MapPin, Building2 } from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Browse BTR Developments by City',
  description: 'Explore Build to Rent developments across UK cities. Find BTR properties in Manchester, London, Birmingham, Leeds, and more.',
  alternates: {
    canonical: `${SITE_URL}/cities`,
  },
};

interface CityData {
  name: string;
  slug: string;
  count: number;
}

export default async function CitiesPage() {
  const { data: developments } = await supabase
    .from('developments')
    .select('area')
    .eq('is_published', true)
    .not('area', 'is', null);

  // Group by area and count
  const cityMap = new Map<string, number>();
  (developments || []).forEach((dev) => {
    if (dev.area) {
      const count = cityMap.get(dev.area) || 0;
      cityMap.set(dev.area, count + 1);
    }
  });

  // Convert to array and sort by count descending
  const cities: CityData[] = Array.from(cityMap.entries())
    .map(([name, count]) => ({
      name,
      slug: generateSlug(name),
      count,
    }))
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cities.map((city) => (
              <Link key={city.slug} href={`/cities/${city.slug}`}>
                <div className="bg-white rounded-lg border border-border p-5 hover:border-primary-blue hover:shadow-md transition-all">
                  <div className="flex items-center mb-2">
                    <MapPin size={18} className="text-primary-blue mr-2" />
                    <h2 className="text-lg font-semibold text-text-primary">{city.name}</h2>
                  </div>
                  <div className="flex items-center text-text-secondary text-sm">
                    <Building2 size={14} className="mr-1" />
                    <span>{city.count} {city.count === 1 ? 'development' : 'developments'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
