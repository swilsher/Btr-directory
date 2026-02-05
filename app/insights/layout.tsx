import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "BTR Insights | Industry News, Case Studies & Market Reports",
  description: "Stay informed with the latest Build-to-Rent industry insights, expert analysis, case studies, and market reports from UK BTR Directory.",
  keywords: [
    "BTR insights",
    "build to rent news",
    "BTR market reports",
    "rental industry analysis",
    "BTR case studies",
    "UK property market",
  ],
  alternates: {
    canonical: "https://ukbtrdirectory.com/insights",
  },
  openGraph: {
    title: "BTR Insights | Industry News, Case Studies & Market Reports",
    description: "Stay informed with the latest Build-to-Rent industry insights, expert analysis, case studies, and market reports.",
    url: "https://ukbtrdirectory.com/insights",
    siteName: "UK BTR Directory",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BTR Insights | Industry News, Case Studies & Market Reports",
    description: "Stay informed with the latest Build-to-Rent industry insights, expert analysis, case studies, and market reports.",
  },
};

export default function InsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
