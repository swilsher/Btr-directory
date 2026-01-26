import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Multifamily BTR Developments UK | 520+ Properties",
  description: "Browse 520+ multifamily build-to-rent developments across the UK. Filter by region, status, and amenities. Comprehensive database of apartment complexes and high-rise rental properties.",
  keywords: ["multifamily BTR", "apartment buildings UK", "rental apartments", "build to rent apartments", "BTR complexes"],
  alternates: {
    canonical: "https://ukbtrdirectory.com/multifamily",
  },
  openGraph: {
    title: "Multifamily BTR Developments UK | 520+ Properties",
    description: "Browse 520+ multifamily build-to-rent developments across the UK. Filter by region, status, and amenities.",
    url: "https://ukbtrdirectory.com/multifamily",
    siteName: "UK BTR Directory",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Multifamily BTR Developments UK | 520+ Properties",
    description: "Browse 520+ multifamily build-to-rent developments across the UK. Filter by region, status, and amenities.",
  },
};

export default function MultifamilyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
