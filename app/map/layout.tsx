import type { Metadata } from 'next';
import { SITE_URL, SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Development Map',
  description: 'Explore UK build-to-rent developments on an interactive map. View BTR project locations, operators, and status across all regions.',
  alternates: {
    canonical: `${SITE_URL}/map`,
  },
  openGraph: {
    title: 'Development Map',
    description: 'Explore UK build-to-rent developments on an interactive map.',
    url: `${SITE_URL}/map`,
    siteName: SITE_NAME,
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Development Map',
    description: 'Explore UK build-to-rent developments on an interactive map.',
  },
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
