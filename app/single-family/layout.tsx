import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Single Family BTR Homes UK | 109+ Properties",
  description: "Explore 109+ single family build-to-rent homes across the UK. Detached and semi-detached rental properties from leading BTR operators.",
  keywords: ["single family rentals UK", "BTR homes", "detached rental properties", "family homes to rent", "single family BTR"],
  alternates: {
    canonical: "https://ukbtrdirectory.com/single-family",
  },
  openGraph: {
    title: "Single Family BTR Homes UK | 109+ Properties",
    description: "Explore 109+ single family build-to-rent homes across the UK. Detached and semi-detached rental properties from leading BTR operators.",
    url: "https://ukbtrdirectory.com/single-family",
    siteName: "UK BTR Directory",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Single Family BTR Homes UK | 109+ Properties",
    description: "Explore 109+ single family build-to-rent homes across the UK. Detached and semi-detached rental properties.",
  },
};

export default function SingleFamilyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
