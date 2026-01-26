import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Supplier } from '@/types/database';
import { ExternalLink, Tag, Mail } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getSupplier(slug: string): Promise<Supplier | null> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supplier = await getSupplier(slug);

  if (!supplier) {
    return {
      title: 'Supplier Not Found',
    };
  }

  const description = `${supplier.name} provides ${supplier.category?.toLowerCase()} services for build-to-rent developments in the UK. ${supplier.description || 'Professional BTR industry services.'}`.substring(0, 160);

  return {
    title: `${supplier.name} | ${supplier.category} for BTR`,
    description,
    keywords: [`${supplier.name}`, supplier.category || '', 'BTR supplier', 'build to rent services', 'property services UK'],
    alternates: {
      canonical: `https://ukbtrdirectory.com/suppliers/${slug}`,
    },
    openGraph: {
      title: `${supplier.name} | ${supplier.category} for BTR`,
      description,
      url: `https://ukbtrdirectory.com/suppliers/${slug}`,
      siteName: 'UK BTR Directory',
      locale: 'en_GB',
      type: 'website',
      images: supplier.logo_url ? [
        {
          url: supplier.logo_url,
          width: 1200,
          height: 630,
          alt: supplier.name,
        },
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${supplier.name} | ${supplier.category}`,
      description,
      images: supplier.logo_url ? [supplier.logo_url] : [],
    },
  };
}

export default async function SupplierDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supplier = await getSupplier(slug);

  if (!supplier) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <section className="bg-gradient-to-br from-primary-blue to-white text-white py-12">
          <div className="container-custom">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {supplier.logo_url && (
                  <div className="bg-white rounded-lg p-4 inline-block mb-4">
                    <img
                      src={supplier.logo_url}
                      alt={supplier.name}
                      className="h-16 object-contain"
                    />
                  </div>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-semibold tracking-normal">{supplier.name}</h1>
                  {supplier.is_featured && (
                    <Badge variant="success" className="text-sm">Featured</Badge>
                  )}
                </div>
                <div className="flex items-center font-medium opacity-95">
                  <Tag size={18} className="mr-2" />
                  <span className="text-lg">{supplier.category}</span>
                </div>
              </div>
              <div className="flex gap-3">
                {supplier.website && (
                  <Link href={supplier.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" className="bg-white text-primary-blue hover:bg-gray-100 border-white">
                      Visit Website <ExternalLink className="ml-2" size={18} />
                    </Button>
                  </Link>
                )}
                {supplier.contact_email && (
                  <Link href={`mailto:${supplier.contact_email}`}>
                    <Button variant="secondary" className="bg-transparent text-white border-white hover:bg-white/10">
                      <Mail className="mr-2" size={18} />
                      Contact
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="container-custom py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg border border-border p-8">
              <h2 className="text-2xl font-semibold mb-4">About {supplier.name}</h2>
              {supplier.description ? (
                <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                  {supplier.description}
                </p>
              ) : (
                <p className="text-text-muted italic">No description available.</p>
              )}

              <div className="mt-8 pt-8 border-t border-border">
                <h3 className="text-lg font-semibold mb-4">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-text-secondary text-sm mb-1">Category</div>
                    <div className="font-medium text-text-primary">{supplier.category}</div>
                  </div>
                  {supplier.website && (
                    <div>
                      <div className="text-text-secondary text-sm mb-1">Website</div>
                      <Link
                        href={supplier.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary-blue hover:underline flex items-center"
                      >
                        {supplier.website.replace(/^https?:\/\//, '')}
                        <ExternalLink size={14} className="ml-1" />
                      </Link>
                    </div>
                  )}
                  {supplier.contact_email && (
                    <div>
                      <div className="text-text-secondary text-sm mb-1">Contact Email</div>
                      <Link
                        href={`mailto:${supplier.contact_email}`}
                        className="font-semibold text-primary-blue hover:underline"
                      >
                        {supplier.contact_email}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Similar Suppliers */}
            <div className="mt-8 bg-blue-50/30 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Looking for more {supplier.category} providers?
              </h3>
              <p className="text-text-secondary mb-4">
                Explore other suppliers in this category
              </p>
              <Link href={`/suppliers?category=${encodeURIComponent(supplier.category)}`}>
                <Button variant="primary">
                  Browse {supplier.category}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
