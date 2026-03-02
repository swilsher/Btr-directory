import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FilterableDevelopmentList from '@/components/filterable/FilterableDevelopmentList';
import JsonLd from '@/components/seo/JsonLd';
import { itemListSchema } from '@/lib/schema';
import { SITE_URL } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

export const revalidate = 60;

export default async function MultifamilyPage() {
  const { data, error } = await supabase
    .from('developments')
    .select('*, asset_owner:asset_owners(*), operator:operators(*)')
    .eq('development_type', 'Multifamily')
    .eq('is_published', true)
    .order('name', { ascending: true });

  const developments = data || [];

  const listSchema = itemListSchema(
    developments.map((dev) => ({ name: dev.name, url: `${SITE_URL}/development/${dev.slug}` })),
    'Multifamily BTR Developments UK'
  );

  return (
    <>
      <JsonLd data={listSchema} />
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
          <FilterableDevelopmentList developments={developments} showSubCategoryFilter />
        </div>
      </main>
      <Footer />
    </>
  );
}
