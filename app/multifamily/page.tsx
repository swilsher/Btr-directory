'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DevelopmentFilters, { FilterValues } from '@/components/filters/DevelopmentFilters';
import DevelopmentCard from '@/components/cards/DevelopmentCard';
import { supabase } from '@/lib/supabase';
import { Development } from '@/types/database';
import { getFriendlyStatus } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function MultifamilyPage() {
  const [developments, setDevelopments] = useState<Development[]>([]);
  const [filteredDevelopments, setFilteredDevelopments] = useState<Development[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemsToShow, setItemsToShow] = useState(24);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchDevelopments();
  }, []);

  const fetchDevelopments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('developments')
        .select('*, asset_owner:asset_owners(*), operator:operators(*)')
        .eq('development_type', 'Multifamily')
        .eq('is_published', true)
        .order('name', { ascending: true });

      if (error) throw error;

      setDevelopments(data || []);
      setFilteredDevelopments(data || []);
    } catch (err) {
      console.error('Error fetching developments:', err);
      setError('Failed to load developments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: FilterValues) => {
    let filtered = [...developments];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (dev) =>
          dev.name.toLowerCase().includes(searchLower) ||
          dev.area?.toLowerCase().includes(searchLower) ||
          dev.description?.toLowerCase().includes(searchLower)
      );
    }

    // Region filter
    if (filters.region) {
      filtered = filtered.filter((dev) => dev.region === filters.region);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((dev) => getFriendlyStatus(dev.status) === filters.status);
    }

    // Units range filter
    if (filters.minUnits) {
      filtered = filtered.filter((dev) => (dev.number_of_units || 0) >= parseInt(filters.minUnits));
    }
    if (filters.maxUnits) {
      filtered = filtered.filter((dev) => (dev.number_of_units || 0) <= parseInt(filters.maxUnits));
    }

    // Amenities filters
    if (filters.amenityGym) {
      filtered = filtered.filter((dev) => dev.amenity_gym === true);
    }
    if (filters.amenityPool) {
      filtered = filtered.filter((dev) => dev.amenity_pool === true);
    }
    if (filters.amenityCoworking) {
      filtered = filtered.filter((dev) => dev.amenity_coworking === true);
    }
    if (filters.amenityConcierge) {
      filtered = filtered.filter((dev) => dev.amenity_concierge === true);
    }

    // Accessibility filters
    if (filters.petsAllowed) {
      filtered = filtered.filter((dev) => dev.pets_allowed === true);
    }
    if (filters.wheelchairAccessible) {
      filtered = filtered.filter((dev) => dev.wheelchair_accessible === true);
    }

    setFilteredDevelopments(filtered);
    setItemsToShow(24); // Reset pagination when filters change
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setItemsToShow((prev) => prev + 24);
      setLoadingMore(false);
    }, 300);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Page Header */}
        <section className="bg-gradient-to-br from-primary-blue to-white text-white py-12">
          <div className="container-custom">
            <h1 className="text-4xl font-semibold mb-3 tracking-normal">Multifamily Developments</h1>
            <p className="text-xl font-medium opacity-95">
              Browse all the BTR developments across the UK
            </p>
          </div>
        </section>

        <div className="container-custom py-8">
          <DevelopmentFilters onFilterChange={handleFilterChange} />

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-primary-blue" size={48} />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-600 mb-4 font-medium">{error}</p>
              <button
                onClick={fetchDevelopments}
                className="text-primary-blue hover:text-primary-blue-hover font-semibold"
              >
                Try Again
              </button>
            </div>
          ) : filteredDevelopments.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-text-secondary text-lg">
                No developments found matching your criteria.
              </p>
              <p className="text-text-muted mt-2">Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div className="mb-6 text-text-secondary">
                Showing {Math.min(itemsToShow, filteredDevelopments.length)} of {filteredDevelopments.length} developments
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDevelopments.slice(0, itemsToShow).map((dev) => (
                  <DevelopmentCard key={dev.id} development={dev} />
                ))}
              </div>

              {itemsToShow < filteredDevelopments.length && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="bg-primary-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-blue-hover transition-all duration-200 disabled:opacity-50"
                  >
                    {loadingMore ? 'Loading...' : 'Load More Developments'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
