import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FilterableSupplierList from '@/components/filterable/FilterableSupplierList';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const revalidate = 60;

export default async function SuppliersPage() {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name', { ascending: true });

  const suppliers = data || [];

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
          <FilterableSupplierList suppliers={suppliers} />

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
