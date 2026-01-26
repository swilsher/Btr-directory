import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://ukbtrdirectory.com'),
  title: {
    default: "UK Build-to-Rent Directory | 614 BTR Developments & Operators",
    template: "%s | UK BTR Directory"
  },
  description: "The most comprehensive database of UK build-to-rent developments, operators, and suppliers. Browse 520+ multifamily and 109 single-family BTR properties across the United Kingdom.",
  keywords: ["build to rent UK", "BTR developments", "rental properties UK", "multifamily housing", "single family homes", "property operators", "BTR directory", "UK rental market"],
  authors: [{ name: "UK BTR Directory" }],
  creator: "UK BTR Directory",
  publisher: "UK BTR Directory",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://ukbtrdirectory.com",
    siteName: "UK BTR Directory",
    title: "UK Build-to-Rent Directory | 614 BTR Developments & Operators",
    description: "The most comprehensive database of UK build-to-rent developments, operators, and suppliers. Browse 520+ multifamily and 109 single-family BTR properties.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "UK BTR Directory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UK Build-to-Rent Directory | 614 BTR Developments & Operators",
    description: "The most comprehensive database of UK build-to-rent developments, operators, and suppliers. Browse 520+ multifamily and 109 single-family BTR properties.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
