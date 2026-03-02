import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { SITE_URL, SITE_NAME } from '@/lib/constants';

export async function generateMetadata(): Promise<Metadata> {
  const { count } = await supabase
    .from('developments')
    .select('id', { count: 'exact', head: true })
    .eq('development_type', 'Single Family')
    .eq('is_published', true);

  const total = count || 0;

  return {
    title: `Single Family BTR Homes UK | ${total}+ Properties`,
    description: `Explore ${total}+ single family build-to-rent homes across the UK. Detached and semi-detached rental properties from leading BTR operators.`,
    alternates: {
      canonical: `${SITE_URL}/single-family`,
    },
    openGraph: {
      title: `Single Family BTR Homes UK | ${total}+ Properties`,
      description: `Explore ${total}+ single family build-to-rent homes across the UK.`,
      url: `${SITE_URL}/single-family`,
      siteName: SITE_NAME,
      locale: 'en_GB',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Single Family BTR Homes UK | ${total}+ Properties`,
      description: `Explore ${total}+ single family build-to-rent homes across the UK.`,
    },
  };
}

export default function SingleFamilyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
