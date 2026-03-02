import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { SITE_URL, SITE_NAME } from '@/lib/constants';

export async function generateMetadata(): Promise<Metadata> {
  const { count } = await supabase
    .from('developments')
    .select('id', { count: 'exact', head: true })
    .eq('development_type', 'Multifamily')
    .eq('is_published', true);

  const total = count || 0;

  return {
    title: `Multifamily BTR Developments UK | ${total}+ Properties`,
    description: `Browse ${total}+ multifamily build-to-rent developments across the UK. Filter by region, status, and amenities. Comprehensive database of apartment complexes and high-rise rental properties.`,
    alternates: {
      canonical: `${SITE_URL}/multifamily`,
    },
    openGraph: {
      title: `Multifamily BTR Developments UK | ${total}+ Properties`,
      description: `Browse ${total}+ multifamily build-to-rent developments across the UK. Filter by region, status, and amenities.`,
      url: `${SITE_URL}/multifamily`,
      siteName: SITE_NAME,
      locale: 'en_GB',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Multifamily BTR Developments UK | ${total}+ Properties`,
      description: `Browse ${total}+ multifamily build-to-rent developments across the UK.`,
    },
  };
}

export default function MultifamilyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
