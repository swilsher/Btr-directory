import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DevelopmentCard from '@/components/cards/DevelopmentCard';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AssetOwner, Development } from '@/types/database';
import { MapPin, ExternalLink, Building2 } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getAssetOwner(slug: string): Promise<AssetOwner | null> {
  const { data, error } = await supabase
    .from('asset_owners')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data;
}

async function getAssetOwnerDevelopments(ownerId: string): Promise<Development[]> {
  const { data, error } = await supabase
    .from('developments')
    .select('*, asset_owner:asset_owners(*), operator:operators(*)')
    .eq('asset_owner_id', ownerId)
    .eq('is_published', true)
    .order('name', { ascending: true });

  if (error || !data) return [];
  return data;
}

export default async function AssetOwnerDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const assetOwner = await getAssetOwner(slug);

  if (!assetOwner) {
    notFound();
  }

  const developments = await getAssetOwnerDevelopments(assetOwner.id);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <section className="bg-gradient-to-br from-primary-blue to-white text-white py-12">
          <div className="container-custom">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {assetOwner.logo_url && (
                  <div className="bg-white rounded-lg p-4 inline-block mb-4">
                    <img
                      src={assetOwner.logo_url}
                      alt={assetOwner.name}
                      className="h-16 object-contain"
                    />
                  </div>
                )}
                <h1 className="text-4xl font-semibold mb-2 tracking-normal">{assetOwner.name}</h1>
                {assetOwner.headquarters && (
                  <div className="flex items-center font-medium opacity-95 mb-4">
                    <MapPin size={18} className="mr-2" />
                    <span>{assetOwner.headquarters}</span>
                  </div>
                )}
              </div>
              {assetOwner.website && (
                <Link href={assetOwner.website} target="_blank" rel="noopener noreferrer">
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
              {assetOwner.description && (
                <div className="bg-white rounded-lg border border-border p-6">
                  <h2 className="text-2xl font-semibold mb-4">About</h2>
                  <p className="text-text-secondary leading-relaxed">{assetOwner.description}</p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">Developments</h2>
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
                    <div className="text-text-secondary text-sm mb-1">Total Developments</div>
                    <div className="text-2xl font-semibold text-primary-blue">{developments.length}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-sm mb-1">Total Units</div>
                    <div className="text-2xl font-semibold text-primary-blue">
                      {developments.reduce((sum, dev) => sum + (dev.number_of_units || 0), 0).toLocaleString()}
                    </div>
                  </div>
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
