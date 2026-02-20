'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Operator } from '@/types/database';
import { Loader2, ExternalLink, Search, Building2, Home } from 'lucide-react';

interface OperatorWithStats extends Operator {
  developmentCount: number;
  totalUnits: number;
}

export default function OperatorsPage() {
  const [operators, setOperators] = useState<OperatorWithStats[]>([]);
  const [filteredOperators, setFilteredOperators] = useState<OperatorWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [minUnits, setMinUnits] = useState('');
  const [maxUnits, setMaxUnits] = useState('');
  const [itemsToShow, setItemsToShow] = useState(24);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchOperators();
  }, []);

  useEffect(() => {
    filterOperators();
  }, [searchTerm, selectedSpecialization, minUnits, maxUnits, operators]);

  const fetchOperators = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('operators')
        .select('*, developments(id, number_of_units)');

      if (error) throw error;

      const withStats: OperatorWithStats[] = (data || []).map((op: any) => {
        const devs = op.developments || [];
        const developmentCount = devs.length;
        const totalUnits = devs.reduce(
          (sum: number, d: any) => sum + (d.number_of_units || 0),
          0
        );
        const { developments, ...operatorData } = op;
        return { ...operatorData, developmentCount, totalUnits };
      });

      // Default sort: most developments first, alphabetical secondary
      withStats.sort((a, b) => {
        if (b.developmentCount !== a.developmentCount) {
          return b.developmentCount - a.developmentCount;
        }
        return a.name.localeCompare(b.name);
      });

      setOperators(withStats);
    } catch (err) {
      console.error('Error fetching operators:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterOperators = () => {
    let filtered = [...operators];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (op) =>
          op.name.toLowerCase().includes(search) ||
          op.description?.toLowerCase().includes(search) ||
          op.specialization?.toLowerCase().includes(search)
      );
    }

    if (selectedSpecialization) {
      filtered = filtered.filter((op) => op.specialization === selectedSpecialization);
    }

    if (minUnits) {
      const min = parseInt(minUnits, 10);
      if (!isNaN(min)) {
        filtered = filtered.filter((op) => op.totalUnits >= min);
      }
    }

    if (maxUnits) {
      const max = parseInt(maxUnits, 10);
      if (!isNaN(max)) {
        filtered = filtered.filter((op) => op.totalUnits <= max);
      }
    }

    setFilteredOperators(filtered);
    setItemsToShow(24);
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setItemsToShow((prev) => prev + 24);
      setLoadingMore(false);
    }, 300);
  };

  const specializations = Array.from(
    new Set(operators.map((op) => op.specialization).filter(Boolean))
  ).sort() as string[];

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
          {/* Filters */}
          <div className="bg-white rounded-lg border border-border p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={18} />
                  <input
                    type="text"
                    placeholder="Search operators..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Specialization</label>
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="input-field"
                >
                  <option value="">All Specializations</option>
                  {specializations.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Min Units</label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  value={minUnits}
                  onChange={(e) => setMinUnits(e.target.value)}
                  className="input-field"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Max Units</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={maxUnits}
                  onChange={(e) => setMaxUnits(e.target.value)}
                  className="input-field"
                  min="0"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-primary-blue" size={48} />
            </div>
          ) : (
            <>
              <div className="mb-6 text-text-secondary">
                Showing {Math.min(itemsToShow, filteredOperators.length)} of {filteredOperators.length} operators
              </div>

              {filteredOperators.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-text-secondary text-lg">
                    No operators found matching your filters.
                  </p>
                  <p className="text-text-muted mt-2">Try adjusting your search or filters.</p>
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
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-xl font-semibold text-text-primary pr-2">{operator.name}</h3>
                          </div>
                          <div className="flex items-center gap-4 text-primary-blue mb-3">
                            <div className="flex items-center">
                              <Building2 size={14} className="mr-1" />
                              <span className="text-sm font-medium">
                                {operator.developmentCount} {operator.developmentCount === 1 ? 'Development' : 'Developments'}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Home size={14} className="mr-1" />
                              <span className="text-sm font-medium">
                                {operator.totalUnits.toLocaleString()} Units
                              </span>
                            </div>
                          </div>
                          <p className="text-text-secondary text-sm mb-4 line-clamp-3 font-medium">
                            {operator.description || 'Company description coming soon.'}
                          </p>
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
