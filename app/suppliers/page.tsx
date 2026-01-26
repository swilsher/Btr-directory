'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Supplier } from '@/types/database';
import { Loader2, ExternalLink, Search, Tag } from 'lucide-react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [itemsToShow, setItemsToShow] = useState(24);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    filterSuppliers();
  }, [searchTerm, selectedCategory, suppliers]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterSuppliers = () => {
    let filtered = [...suppliers];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          s.description?.toLowerCase().includes(search) ||
          s.category.toLowerCase().includes(search)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((s) => s.category === selectedCategory);
    }

    setFilteredSuppliers(filtered);
    setItemsToShow(24); // Reset pagination when filters change
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setItemsToShow((prev) => prev + 24);
      setLoadingMore(false);
    }, 300);
  };

  const categories = Array.from(new Set(suppliers.map((s) => s.category))).sort();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <section className="bg-gradient-to-br from-primary-blue to-white text-white py-12">
          <div className="container-custom">
            <h1 className="text-4xl font-semibold mb-3 tracking-normal">BTR Suppliers</h1>
            <p className="text-xl font-medium opacity-95">
              Browse {suppliers.length} suppliers and service providers for the BTR industry
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
                    placeholder="Search suppliers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input-field"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
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
                Showing {Math.min(itemsToShow, filteredSuppliers.length)} of {filteredSuppliers.length} suppliers
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSuppliers.slice(0, itemsToShow).map((supplier) => (
                  <Link key={supplier.id} href={`/suppliers/${supplier.slug}`}>
                    <Card className="h-full p-6">
                      {supplier.logo_url && (
                        <div className="h-20 mb-4 flex items-center justify-center">
                          <img
                            src={supplier.logo_url}
                            alt={supplier.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold text-text-primary pr-2">{supplier.name}</h3>
                        {supplier.is_featured && (
                          <Badge variant="success" className="text-xs">Featured</Badge>
                        )}
                      </div>
                      <div className="flex items-center text-primary-blue mb-3">
                        <Tag size={14} className="mr-1" />
                        <span className="text-sm font-medium">{supplier.category}</span>
                      </div>
                      {supplier.description && (
                        <p className="text-text-secondary text-sm mb-4 line-clamp-3 font-medium">
                          {supplier.description}
                        </p>
                      )}
                      {supplier.website && (
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

              {itemsToShow < filteredSuppliers.length && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="bg-primary-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-blue-hover transition-all duration-200 disabled:opacity-50"
                  >
                    {loadingMore ? 'Loading...' : 'Load More Suppliers'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* CTA */}
          <div className="mt-12 bg-gradient-to-r from-primary-blue to-white rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-semibold mb-3">Are you a BTR Supplier?</h2>
            <p className="font-medium opacity-95 mb-6">
              Get listed in our directory and reach thousands of BTR professionals
            </p>
            <Link href="/submit-supplier">
              <button className="bg-white text-primary-blue px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Submit Your Company
              </button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
