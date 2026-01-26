import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "BTR Operators & Property Management Companies UK",
  description: "Directory of build-to-rent operators and property management companies in the UK. Search leading BTR operators including Greystar, Essential Living, Get Living, and more.",
  keywords: ["BTR operators UK", "property management companies", "rental operators", "build to rent companies", "BTR property managers"],
  alternates: {
    canonical: "https://ukbtrdirectory.com/operators",
  },
  openGraph: {
    title: "BTR Operators & Property Management Companies UK",
    description: "Directory of build-to-rent operators and property management companies in the UK. Search leading BTR operators.",
    url: "https://ukbtrdirectory.com/operators",
    siteName: "UK BTR Directory",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BTR Operators & Property Management Companies UK",
    description: "Directory of build-to-rent operators and property management companies in the UK.",
  },
};

export default function OperatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
