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
  params: Promise<{ slug: string }>;
}

const getCityData = cache(async (slug: string) => {
  // Get all unique areas
  const { data: developments } = await supabase
    .from('developments')
    .select('area')
    .eq('is_published', true)
    .not('area', 'is', null);

  // Find the area that matches this slug
  const areas = new Set((developments || []).map((d) => d.area).filter(Boolean));
  let matchedArea: string | null = null;

  for (const area of areas) {
    if (generateSlug(area!) === slug) {
      matchedArea = area!;
      break;
    }
  }

  if (!matchedArea) return null;

  // Fetch all developments for this area
  const { data: cityDevelopments } = await supabase
    .from('developments')
    .select('*, asset_owner:asset_owners(*), operator:operators(*)')
    .eq('is_published', true)
    .eq('area', matchedArea)
    .order('name', { ascending: true });

  return {
    area: matchedArea,
    developments: cityDevelopments || [],
  };
});

export async function generateStaticParams() {
  const { data } = await supabase
    .from('developments')
    .select('area')
    .eq('is_published', true)
    .not('area', 'is', null);

  const areas = new Set((data || []).map((d) => d.area).filter(Boolean));
  return Array.from(areas).map((area) => ({
    slug: generateSlug(area!),
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
    title: `Build to Rent Developments in ${cityData.area}`,
    description: `Browse ${count} Build to Rent ${count === 1 ? 'development' : 'developments'} in ${cityData.area}. Find BTR properties, operators, and amenities in ${cityData.area}.`,
    alternates: {
      canonical: `${SITE_URL}/cities/${slug}`,
    },
    openGraph: {
      title: `Build to Rent Developments in ${cityData.area} | ${SITE_NAME}`,
      description: `Browse ${count} BTR developments in ${cityData.area}.`,
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

  const { area, developments } = cityData;

  const listSchema = itemListSchema(
    developments.map((dev) => ({ name: dev.name, url: `${SITE_URL}/development/${dev.slug}` })),
    `BTR Developments in ${area}`
  );

  return (
    <>
      <JsonLd data={listSchema} />
      <Header />
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Cities', href: '/cities' },
        { label: area, href: `/cities/${slug}` },
      ]} />
      <main className="min-h-screen bg-background">
        <section className="bg-gradient-to-br from-primary-blue to-white text-white py-12">
          <div className="container-custom">
            <h1 className="text-4xl font-semibold mb-3 tracking-normal">
              Build to Rent in {area}
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
