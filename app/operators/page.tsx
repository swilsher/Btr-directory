'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Operator } from '@/types/database';
import { Loader2, MapPin, ExternalLink, Search } from 'lucide-react';

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [filteredOperators, setFilteredOperators] = useState<Operator[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [itemsToShow, setItemsToShow] = useState(20);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('operators')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setOperators(data || []);
      setFilteredOperators(data || []);
    } catch (err) {
      console.error('Error fetching operators:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredOperators(operators);
      setItemsToShow(20); // Reset pagination
      return;
    }

    const searchLower = query.toLowerCase();
    const filtered = operators.filter((operator) =>
      operator.name.toLowerCase().includes(searchLower)
    );
    setFilteredOperators(filtered);
    setItemsToShow(20); // Reset pagination when searching
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setItemsToShow((prev) => prev + 20);
      setLoadingMore(false);
    }, 300);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <section className="bg-gradient-to-br from-primary-blue to-white text-white py-12">
          <div className="container-custom">
            <h1 className="text-4xl font-semibold mb-3 tracking-normal">Operators</h1>
            <p className="text-xl font-medium opacity-95">
              Browse {operators.length} BTR property management operators
            </p>
          </div>
        </section>

        <div className="container-custom py-8">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
              <input
                type="text"
                placeholder="Search operators..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-primary-blue" size={48} />
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="mb-6 text-text-secondary">
                Showing {Math.min(itemsToShow, filteredOperators.length)} of {filteredOperators.length} operators
              </div>

              {filteredOperators.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-text-secondary text-lg">
                    No operators found matching your search.
                  </p>
                  <p className="text-text-muted mt-2">Try a different search term.</p>
                </div>
              ) : (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredOperators.slice(0, itemsToShow).map((operator) => (
                <Link key={operator.id} href={`/operators/${operator.slug}`}>
                  <Card className="h-full p-6">
                    {operator.logo_url && (
                      <div className="h-20 mb-4 flex items-center justify-center">
                        <img
                          src={operator.logo_url}
                          alt={operator.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    )}
                    <h3 className="text-xl font-semibold text-text-primary mb-2">{operator.name}</h3>
                    {operator.headquarters && (
                      <div className="flex items-center text-text-secondary mb-3">
                        <MapPin size={16} className="mr-1" />
                        <span className="text-sm">{operator.headquarters}</span>
                      </div>
                    )}
                    {operator.specialization && (
                      <div className="mb-3">
                        <span className="text-xs bg-blue-50 text-primary-blue px-2 py-1 rounded font-semibold">
                          {operator.specialization}
                        </span>
                      </div>
                    )}
                    {operator.description && (
                      <p className="text-text-secondary text-sm mb-4 line-clamp-3 font-medium">
                        {operator.description}
                      </p>
                    )}
                    {operator.website && (
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

              {itemsToShow < filteredOperators.length && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="bg-primary-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-blue-hover transition-all duration-200 disabled:opacity-50"
                  >
                    {loadingMore ? 'Loading...' : 'Load More Operators'}
                  </button>
                </div>
              )}
              </>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
