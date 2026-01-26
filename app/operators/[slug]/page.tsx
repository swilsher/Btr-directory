import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DevelopmentCard from '@/components/cards/DevelopmentCard';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Operator, Development } from '@/types/database';
import { MapPin, ExternalLink, Building2, Tag } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getOperator(slug: string): Promise<Operator | null> {
  const { data, error } = await supabase
    .from('operators')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data;
}

async function getOperatorDevelopments(operatorId: string): Promise<Development[]> {
  const { data, error } = await supabase
    .from('developments')
    .select('*, asset_owner:asset_owners(*), operator:operators(*)')
    .eq('operator_id', operatorId)
    .eq('is_published', true)
    .order('name', { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const operator = await getOperator(slug);

  if (!operator) {
    return {
      title: 'Operator Not Found',
    };
  }

  const developments = await getOperatorDevelopments(operator.id);
  const developmentCount = developments.length;
  const developmentText = developmentCount > 0 ? ` managing ${developmentCount} development${developmentCount !== 1 ? 's' : ''} across the UK` : '';

  const description = `${operator.name} - Build-to-rent property operator${developmentText}. ${operator.description || 'Professional BTR property management services.'}`.substring(0, 160);

  return {
    title: `${operator.name} | BTR Property Operator`,
    description,
    keywords: [`${operator.name}`, 'BTR operator', 'property management UK', operator.specialization || '', 'build to rent'],
    alternates: {
      canonical: `https://ukbtrdirectory.com/operators/${slug}`,
    },
    openGraph: {
      title: `${operator.name} | BTR Property Operator`,
      description,
      url: `https://ukbtrdirectory.com/operators/${slug}`,
      siteName: 'UK BTR Directory',
      locale: 'en_GB',
      type: 'website',
      images: operator.logo_url ? [
        {
          url: operator.logo_url,
          width: 1200,
          height: 630,
          alt: operator.name,
        },
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${operator.name} | BTR Property Operator`,
      description,
      images: operator.logo_url ? [operator.logo_url] : [],
    },
  };
}

export default async function OperatorDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const operator = await getOperator(slug);

  if (!operator) {
    notFound();
  }

  const developments = await getOperatorDevelopments(operator.id);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <section className="bg-gradient-to-br from-primary-blue to-white text-white py-12">
          <div className="container-custom">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {operator.logo_url && (
                  <div className="bg-white rounded-lg p-4 inline-block mb-4">
                    <img
                      src={operator.logo_url}
                      alt={operator.name}
                      className="h-16 object-contain"
                    />
                  </div>
                )}
                <h1 className="text-4xl font-semibold mb-2 tracking-normal">{operator.name}</h1>
                <div className="flex flex-wrap gap-4 font-medium opacity-95">
                  {operator.headquarters && (
                    <div className="flex items-center">
                      <MapPin size={18} className="mr-2" />
                      <span>{operator.headquarters}</span>
                    </div>
                  )}
                  {operator.specialization && (
                    <div className="flex items-center">
                      <Tag size={18} className="mr-2" />
                      <span>{operator.specialization}</span>
                    </div>
                  )}
                </div>
              </div>
              {operator.website && (
                <Link href={operator.website} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" className="bg-white text-primary-blue hover:bg-gray-100 border-white">
                    Visit Website <ExternalLink className="ml-2" size={18} />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        <div className="container-custom py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {operator.description && (
                <div className="bg-white rounded-lg border border-border p-6">
                  <h2 className="text-2xl font-semibold mb-4">About</h2>
                  <p className="text-text-secondary leading-relaxed">{operator.description}</p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">Managed Developments</h2>
                  <div className="flex items-center text-text-secondary">
                    <Building2 size={20} className="mr-2" />
                    <span>{developments.length} properties</span>
                  </div>
                </div>

                {developments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {developments.map((dev) => (
                      <DevelopmentCard key={dev.id} development={dev} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-border p-8 text-center">
                    <p className="text-text-secondary">No developments listed yet.</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="bg-white rounded-lg border border-border p-6 sticky top-8">
                <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-text-secondary text-sm mb-1">Managed Developments</div>
                    <div className="text-2xl font-semibold text-primary-blue">{developments.length}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-sm mb-1">Total Units Under Management</div>
                    <div className="text-2xl font-semibold text-primary-blue">
                      {developments.reduce((sum, dev) => sum + (dev.number_of_units || 0), 0).toLocaleString()}
                    </div>
                  </div>
                  {operator.specialization && (
                    <div>
                      <div className="text-text-secondary text-sm mb-1">Specialization</div>
                      <div className="font-semibold text-text-primary">{operator.specialization}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
