'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AssetOwner } from '@/types/database';
import { Loader2, MapPin, ExternalLink } from 'lucide-react';

export default function AssetOwnersPage() {
  const [assetOwners, setAssetOwners] = useState<AssetOwner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssetOwners();
  }, []);

  const fetchAssetOwners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('asset_owners')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setAssetOwners(data || []);
    } catch (err) {
      console.error('Error fetching asset owners:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <section className="bg-gradient-to-br from-primary-blue to-white text-white py-12">
          <div className="container-custom">
            <h1 className="text-4xl font-semibold mb-3 tracking-normal">Asset Owners</h1>
            <p className="text-xl font-medium opacity-95">
              Browse {assetOwners.length} BTR asset owners and investors
            </p>
          </div>
        </section>

        <div className="container-custom py-8">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-primary-blue" size={48} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assetOwners.map((owner) => (
                <Link key={owner.id} href={`/asset-owners/${owner.slug}`}>
                  <Card className="h-full p-6">
                    {owner.logo_url && (
                      <div className="h-20 mb-4 flex items-center justify-center">
                        <img
                          src={owner.logo_url}
                          alt={owner.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    )}
                    <h3 className="text-xl font-semibold text-text-primary mb-2">{owner.name}</h3>
                    {owner.headquarters && (
                      <div className="flex items-center text-text-secondary mb-3">
                        <MapPin size={16} className="mr-1" />
                        <span className="text-sm">{owner.headquarters}</span>
                      </div>
                    )}
                    {owner.description && (
                      <p className="text-text-secondary text-sm mb-4 line-clamp-3">
                        {owner.description}
                      </p>
                    )}
                    {owner.website && (
                      <div className="mt-auto pt-4 border-t border-border">
                        <span className="text-primary-blue text-sm flex items-center hover:underline font-semibold">
                          Visit Website <ExternalLink size={14} className="ml-1" />
                        </span>
                      </div>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
