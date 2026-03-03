import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DevelopmentCard from '@/components/cards/DevelopmentCard';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { itemListSchema } from '@/lib/schema';
import { SITE_URL, SITE_NAME } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { generateSlug } from '@/lib/utils';
import Link from 'next/link';
import { MapPin } from 'lucide-react';

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug: string }>;
}

const getCityData = cache(async (slug: string) => {
  // Get all unique cities
  const { data: developments } = await supabase
    .from('developments')
    .select('city')
    .eq('is_published', true)
    .not('city', 'is', null);

  // Find the city that matches this slug
  const cities = new Set((developments || []).map((d) => d.city).filter(Boolean));
  let matchedCity: string | null = null;

  for (const city of cities) {
    if (generateSlug(city!) === slug) {
      matchedCity = city!;
      break;
    }
  }

  if (!matchedCity) return null;

  // Fetch all developments for this city
  const { data: cityDevelopments } = await supabase
    .from('developments')
    .select('*, asset_owner:asset_owners(*), operator:operators(*)')
    .eq('is_published', true)
    .eq('city', matchedCity)
    .order('name', { ascending: true });

  // Group developments by area to identify sub-areas
  const areaMap = new Map<string, number>();
  (cityDevelopments || []).forEach((dev) => {
    if (dev.area) {
      const count = areaMap.get(dev.area) || 0;
      areaMap.set(dev.area, count + 1);
    }
  });

  const areas = Array.from(areaMap.entries())
    .map(([name, count]) => ({
      name,
      slug: generateSlug(name),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    city: matchedCity,
    developments: cityDevelopments || [],
    areas,
  };
});

export async function generateStaticParams() {
  const { data } = await supabase
    .from('developments')
    .select('city')
    .eq('is_published', true)
    .not('city', 'is', null);

  const cities = new Set((data || []).map((d) => d.city).filter(Boolean));
  return Array.from(cities).map((city) => ({
    slug: generateSlug(city!),
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cityData = await getCityData(slug);

  if (!cityData) {
    return { title: 'City Not Found' };
  }

  const count = cityData.developments.length;

  return {
    title: `Build to Rent Developments in ${cityData.city}`,
    description: `Browse ${count} Build to Rent ${count === 1 ? 'development' : 'developments'} in ${cityData.city}. Find BTR properties, operators, and amenities.`,
    alternates: {
      canonical: `${SITE_URL}/cities/${slug}`,
    },
    openGraph: {
      title: `Build to Rent Developments in ${cityData.city} | ${SITE_NAME}`,
      description: `Browse ${count} BTR developments in ${cityData.city}.`,
      url: `${SITE_URL}/cities/${slug}`,
      siteName: SITE_NAME,
      locale: 'en_GB',
      type: 'website',
    },
  };
}

export default async function CityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const cityData = await getCityData(slug);

  if (!cityData) {
    notFound();
  }

  const { city, developments, areas } = cityData;

  const listSchema = itemListSchema(
    developments.map((dev) => ({ name: dev.name, url: `${SITE_URL}/development/${dev.slug}` })),
    `BTR Developments in ${city}`
  );

  const hasAreas = areas.length > 1;

  return (
    <>
      <JsonLd data={listSchema} />
      <Header />
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Cities', href: '/cities' },
        { label: city, href: `/cities/${slug}` },
      ]} />
      <main className="min-h-screen bg-background">
        <section className="bg-gradient-to-br from-primary-blue to-white text-white py-12">
          <div className="container-custom">
            <h1 className="text-4xl font-semibold mb-3 tracking-normal">
              Build to Rent in {city}
            </h1>
            <p className="text-xl font-medium opacity-95">
              {developments.length} {developments.length === 1 ? 'development' : 'developments'} in {city}
            </p>
          </div>
        </section>

        <div className="container-custom py-8">
          {/* Area/Borough navigation — only show if city has multiple sub-areas */}
          {hasAreas && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-text-primary mb-3">
                Browse by Area
              </h2>
              <div className="flex flex-wrap gap-2">
                {areas.map((area) => (
                  <Link
                    key={area.slug}
                    href={`/cities/${slug}/${area.slug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-border rounded-full text-sm font-medium text-text-secondary hover:border-primary-blue hover:text-primary-blue transition-all"
                  >
                    <MapPin size={14} />
                    {area.name}
                    <span className="text-text-muted ml-1">({area.count})</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* All developments grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {developments.map((dev) => (
              <DevelopmentCard key={dev.id} development={dev} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
