import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { SITE_URL, SITE_NAME } from '@/lib/constants';

export async function generateMetadata(): Promise<Metadata> {
  const { count } = await supabase
    .from('suppliers')
    .select('id', { count: 'exact', head: true });

  const total = count || 0;

  return {
    title: `BTR Industry Suppliers & Service Providers UK | ${total}+ Companies`,
    description: `Connect with ${total}+ BTR industry suppliers across energy, consultancy, technology, architecture, and interior design. Directory of service providers for build-to-rent developments.`,
    alternates: {
      canonical: `${SITE_URL}/suppliers`,
    },
    openGraph: {
      title: 'BTR Industry Suppliers & Service Providers UK',
      description: `Connect with ${total}+ BTR industry suppliers and service providers.`,
      url: `${SITE_URL}/suppliers`,
      siteName: SITE_NAME,
      locale: 'en_GB',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'BTR Industry Suppliers & Service Providers UK',
      description: `Connect with ${total}+ BTR industry suppliers and service providers.`,
    },
  };
}

export default function SuppliersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
