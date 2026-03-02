import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FilterableDevelopmentList from '@/components/filterable/FilterableDevelopmentList';
import { supabase } from '@/lib/supabase';

export const revalidate = 60;

export default async function SingleFamilyPage() {
  const { data, error } = await supabase
    .from('developments')
    .select('*, asset_owner:asset_owners(*), operator:operators(*)')
    .eq('development_type', 'Single Family')
    .eq('is_published', true)
    .order('name', { ascending: true });

  const developments = data || [];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <section className="bg-gradient-to-br from-primary-blue to-white text-white py-12">
          <div className="container-custom">
            <h1 className="text-4xl font-semibold mb-3 tracking-normal">Single Family Developments</h1>
            <p className="text-xl font-medium opacity-95">
              Browse {developments.length} single family BTR developments across the UK
            </p>
          </div>
        </section>

        <div className="container-custom py-8">
          <FilterableDevelopmentList developments={developments} />
        </div>
      </main>
      <Footer />
    </>
  );
}
