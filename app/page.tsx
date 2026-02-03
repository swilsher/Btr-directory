import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import { ArrowRight, Building2, Users, Building, Package, TrendingUp, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Development } from '@/types/database';
import { formatNumber, getFriendlyStatus, getStatusColor } from '@/lib/utils';
import NewsletterForm from '@/components/forms/NewsletterForm';

export const metadata: Metadata = {
  title: "UK Build-to-Rent Directory | 614 BTR Developments & Operators",
  description: "The most comprehensive database of UK build-to-rent developments, operators, and suppliers. Browse 520+ multifamily and 109 single-family BTR properties across the United Kingdom.",
  keywords: ["build to rent UK", "BTR developments", "rental properties UK", "multifamily housing", "single family homes", "property operators"],
  alternates: {
    canonical: "https://ukbtrdirectory.com",
  },
  openGraph: {
    title: "UK Build-to-Rent Directory | 614 BTR Developments & Operators",
    description: "The most comprehensive database of UK build-to-rent developments, operators, and suppliers. Browse 520+ multifamily and 109 single-family BTR properties.",
    url: "https://ukbtrdirectory.com",
    siteName: "UK BTR Directory",
    locale: "en_GB",
    type: "website",
  },
};

async function getStats() {
  const [multifamilyCount, singleFamilyCount, operatorsCount, suppliersCount] = await Promise.all([
    supabase.from('developments').select('id', { count: 'exact', head: true }).eq('development_type', 'Multifamily').eq('is_published', true),
    supabase.from('developments').select('id', { count: 'exact', head: true }).eq('development_type', 'Single Family').eq('is_published', true),
    supabase.from('operators').select('id', { count: 'exact', head: true }),
    supabase.from('suppliers').select('id', { count: 'exact', head: true }),
  ]);

  return {
    multifamily: multifamilyCount.count || 0,
    singleFamily: singleFamilyCount.count || 0,
    operators: operatorsCount.count || 0,
    suppliers: suppliersCount.count || 0,
  };
}

async function getFeaturedDevelopments() {
  const { data, error } = await supabase
    .from('developments')
    .select('*, asset_owner:asset_owners(*), operator:operators(*)')
    .eq('is_published', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(4);

  if (error) {
    console.error('Error fetching featured developments:', error);
    return [];
  }

  return data as Development[];
}

export default async function HomePage() {
  const stats = await getStats();
  const featuredDevelopments = await getFeaturedDevelopments();

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-blue to-white text-white py-20">
          <div className="container-custom">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-semibold mb-6 tracking-normal">
                UK Build-to-Rent Directory
              </h1>
              <p className="text-xl mb-8 font-medium opacity-95">
                The most comprehensive database of BTR developments, operators, asset owners, and suppliers across the United Kingdom.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/multifamily">
                  <Button variant="secondary" size="lg" className="bg-white text-primary-blue hover:bg-gray-100 border-white">
                    Browse Multifamily <ArrowRight className="ml-2" size={20} />
                  </Button>
                </Link>
                <Link href="/single-family">
                  <Button variant="secondary" size="lg" className="bg-white text-primary-blue hover:bg-gray-100 border-white">
                    Browse Single Family <ArrowRight className="ml-2" size={20} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Developments */}
        {featuredDevelopments.length > 0 && (
          <section className="py-20 bg-white">
            <div className="container-custom">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-semibold text-text-primary mb-3">Featured Developments</h2>
                <p className="text-lg text-text-secondary font-medium">Explore our curated selection of notable BTR projects</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {featuredDevelopments.map((dev) => (
                  <Link key={dev.id} href={`/development/${dev.slug}`}>
                    <Card className="h-full overflow-hidden group">
                      {dev.image_url && (
                        <div className="relative bg-gray-200 overflow-hidden h-48">
                          <img
                            src={dev.image_url}
                            alt={dev.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-text-primary mb-3">{dev.name}</h3>

                        {dev.area && (
                          <div className="flex items-start gap-2 mb-3 text-text-secondary">
                            <MapPin size={18} className="text-primary-blue flex-shrink-0 mt-0.5" />
                            <span className="font-medium text-sm">{dev.area}</span>
                          </div>
                        )}

                        <div className="space-y-2 mb-4">
                          {dev.operator && (
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                              <span className="text-text-secondary font-medium text-sm">Operator</span>
                              <span className="font-semibold text-text-primary text-sm">{dev.operator.name}</span>
                            </div>
                          )}
                          {dev.number_of_units && (
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                              <span className="text-text-secondary font-medium text-sm">Units</span>
                              <span className="font-semibold text-text-primary text-sm">{formatNumber(dev.number_of_units)}</span>
                            </div>
                          )}
                          {dev.status && (
                            <div className="flex justify-between items-center">
                              <span className="text-text-secondary font-medium text-sm">Status</span>
                              <Badge className={getStatusColor(dev.status)}>{getFriendlyStatus(dev.status)}</Badge>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center text-primary-blue font-semibold group-hover:gap-2 transition-all text-sm">
                          <span>View Development</span>
                          <ArrowRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Categories Section */}
        <section className="py-20 bg-white">
          <div className="container-custom">
            <h2 className="text-3xl font-semibold text-text-primary mb-12 text-center">Explore by Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Link href="/multifamily">
                <Card className="p-8 text-center h-full">
                  <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <Building2 className="text-primary-blue" size={32} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Multifamily</h3>
                  <p className="text-text-secondary text-sm mb-4 font-medium">Apartment complexes and high-rise developments</p>
                  <div className="text-2xl font-semibold text-primary-blue">{formatNumber(stats.multifamily)}</div>
                </Card>
              </Link>

              <Link href="/single-family">
                <Card className="p-8 text-center h-full">
                  <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <Building className="text-primary-blue" size={32} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Single Family</h3>
                  <p className="text-text-secondary text-sm mb-4 font-medium">Detached and semi-detached rental homes</p>
                  <div className="text-2xl font-semibold text-primary-blue">{formatNumber(stats.singleFamily)}</div>
                </Card>
              </Link>

              <Link href="/operators">
                <Card className="p-8 text-center h-full">
                  <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <Users className="text-primary-blue" size={32} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Operators</h3>
                  <p className="text-text-secondary text-sm mb-4">Property management companies</p>
                  <div className="text-2xl font-semibold text-primary-blue">{formatNumber(stats.operators)}</div>
                </Card>
              </Link>

              <Link href="/suppliers">
                <Card className="p-8 text-center h-full">
                  <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <Package className="text-primary-blue" size={32} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Suppliers</h3>
                  <p className="text-text-secondary text-sm mb-4">BTR industry service providers</p>
                  <div className="text-2xl font-semibold text-primary-blue">{formatNumber(stats.suppliers)}</div>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section id="newsletter" className="py-20 bg-blue-50/50">
          <div className="container-custom">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                <TrendingUp className="text-primary-blue" size={32} />
              </div>
              <h2 className="text-3xl font-semibold text-text-primary mb-4">Stay Updated</h2>
              <p className="text-text-secondary mb-8 font-medium">
                Subscribe to our newsletter for the latest BTR market insights, new developments, and industry trends.
              </p>
              <NewsletterForm />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-white">
          <div className="container-custom">
            <div className="bg-gradient-to-r from-primary-blue to-blue-400 rounded-2xl p-12 text-center text-white shadow-lg">
              <h2 className="text-3xl font-semibold mb-4">Missing a Development?</h2>
              <p className="text-xl mb-8 font-medium opacity-95">
                Help us keep our database comprehensive and accurate
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/submit-correction">
                  <Button variant="secondary" size="lg" className="bg-white text-primary-blue hover:bg-gray-100 border-white">
                    Submit Correction
                  </Button>
                </Link>
                <Link href="/submit-supplier">
                  <Button variant="secondary" size="lg" className="bg-white text-primary-blue hover:bg-gray-100 border-white">
                    Add Your Company
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
