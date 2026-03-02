import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "BTR Industry Suppliers & Service Providers UK",
  description: "Connect with BTR industry suppliers across energy, consultancy, technology, architecture, and interior design. Directory of 32+ service providers for build-to-rent developments.",
  keywords: ["BTR suppliers", "property technology", "BTR consultancy", "architecture firms", "interior design", "BTR service providers"],
  alternates: {
    canonical: "https://www.buildtorentdirectory.co.uk/suppliers",
  },
  openGraph: {
    title: "BTR Industry Suppliers & Service Providers UK",
    description: "Connect with BTR industry suppliers across energy, consultancy, technology, architecture, and interior design.",
    url: "https://www.buildtorentdirectory.co.uk/suppliers",
    siteName: "UK BTR Directory",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BTR Industry Suppliers & Service Providers UK",
    description: "Connect with BTR industry suppliers across energy, consultancy, technology, architecture, and interior design.",
  },
};

export default function SuppliersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
