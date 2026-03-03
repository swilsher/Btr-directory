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

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug: string; area: string }>;
}

const getAreaData = cache(async (citySlug: string, areaSlug: string) => {
  // Fetch all published developments with city and area
  const { data: allDevs } = await supabase
    .from('developments')
    .select('city, area')
    .eq('is_published', true)
    .not('city', 'is', null)
    .not('area', 'is', null);

  // Find the matching city and area names from slugs
  let matchedCity: string | null = null;
  let matchedArea: string | null = null;

  for (const dev of allDevs || []) {
    if (dev.city && generateSlug(dev.city) === citySlug) {
      matchedCity = dev.city;
      if (dev.area && generateSlug(dev.area) === areaSlug) {
        matchedArea = dev.area;
        break;
      }
    }
  }

  if (!matchedCity || !matchedArea) return null;

  // Fetch developments for this city + area combination
  const { data: developments } = await supabase
    .from('developments')
    .select('*, asset_owner:asset_owners(*), operator:operators(*)')
    .eq('is_published', true)
    .eq('city', matchedCity)
    .eq('area', matchedArea)
    .order('name', { ascending: true });

  return {
    city: matchedCity,
    area: matchedArea,
    developments: developments || [],
  };
});

export async function generateStaticParams() {
  const { data } = await supabase
    .from('developments')
    .select('city, area')
    .eq('is_published', true)
    .not('city', 'is', null)
    .not('area', 'is', null);

  // Build unique city+area pairs
  const pairs = new Set<string>();
  const result: { slug: string; area: string }[] = [];

  (data || []).forEach((dev) => {
    if (!dev.city || !dev.area) return;
    const key = `${dev.city}|${dev.area}`;
    if (!pairs.has(key)) {
      pairs.add(key);
      result.push({
        slug: generateSlug(dev.city),
        area: generateSlug(dev.area),
      });
    }
  });

  return result;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, area: areaSlug } = await params;
  const areaData = await getAreaData(slug, areaSlug);

  if (!areaData) {
    return { title: 'Area Not Found' };
  }

  const count = areaData.developments.length;

  return {
    title: `Build to Rent Developments in ${areaData.area}, ${areaData.city}`,
    description: `Browse ${count} Build to Rent ${count === 1 ? 'development' : 'developments'} in ${areaData.area}, ${areaData.city}. Find BTR properties, operators, and amenities.`,
    alternates: {
      canonical: `${SITE_URL}/cities/${slug}/${areaSlug}`,
    },
    openGraph: {
      title: `Build to Rent in ${areaData.area}, ${areaData.city} | ${SITE_NAME}`,
      description: `Browse ${count} BTR developments in ${areaData.area}, ${areaData.city}.`,
      url: `${SITE_URL}/cities/${slug}/${areaSlug}`,
      siteName: SITE_NAME,
      locale: 'en_GB',
      type: 'website',
    },
  };
}

export default async function AreaDetailPage({ params }: PageProps) {
  const { slug, area: areaSlug } = await params;
  const areaData = await getAreaData(slug, areaSlug);

  if (!areaData) {
    notFound();
  }

  const { city, area, developments } = areaData;

  const listSchema = itemListSchema(
    developments.map((dev) => ({ name: dev.name, url: `${SITE_URL}/development/${dev.slug}` })),
    `BTR Developments in ${area}, ${city}`
  );

  return (
    <>
      <JsonLd data={listSchema} />
      <Header />
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Cities', href: '/cities' },
        { label: city, href: `/cities/${slug}` },
        { label: area, href: `/cities/${slug}/${areaSlug}` },
      ]} />
      <main className="min-h-screen bg-background">
        <section className="bg-gradient-to-br from-primary-blue to-white text-white py-12">
          <div className="container-custom">
            <h1 className="text-4xl font-semibold mb-3 tracking-normal">
              Build to Rent in {area}, {city}
            </h1>
            <p className="text-xl font-medium opacity-95">
              {developments.length} {developments.length === 1 ? 'development' : 'developments'} in {area}
            </p>
          </div>
        </section>

        <div className="container-custom py-8">
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
