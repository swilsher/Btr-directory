import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { SITE_URL, SITE_NAME } from '@/lib/constants';

export async function generateMetadata(): Promise<Metadata> {
  const { count } = await supabase
    .from('operators')
    .select('id', { count: 'exact', head: true });

  const total = count || 0;

  return {
    title: `BTR Operators & Property Management Companies UK | ${total}+ Operators`,
    description: `Directory of ${total}+ build-to-rent operators and property management companies in the UK. Search leading BTR operators including Greystar, Essential Living, Get Living, and more.`,
    alternates: {
      canonical: `${SITE_URL}/operators`,
    },
    openGraph: {
      title: 'BTR Operators & Property Management Companies UK',
      description: `Directory of ${total}+ build-to-rent operators and property management companies in the UK.`,
      url: `${SITE_URL}/operators`,
      siteName: SITE_NAME,
      locale: 'en_GB',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'BTR Operators & Property Management Companies UK',
      description: `Directory of ${total}+ build-to-rent operators and property management companies in the UK.`,
    },
  };
}

export default function OperatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
