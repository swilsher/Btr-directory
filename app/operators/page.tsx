import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FilterableOperatorList from '@/components/filterable/FilterableOperatorList';
import type { OperatorWithStats } from '@/components/filterable/FilterableOperatorList';
import JsonLd from '@/components/seo/JsonLd';
import { itemListSchema } from '@/lib/schema';
import { SITE_URL } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

export const revalidate = 60;

export default async function OperatorsPage() {
  const { data, error } = await supabase
    .from('operators')
    .select('*, developments(id, number_of_units)');

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

  const listSchema = itemListSchema(
    withStats.map((op) => ({ name: op.name, url: `${SITE_URL}/operators/${op.slug}` })),
    'BTR Operators UK'
  );

  return (
    <>
      <JsonLd data={listSchema} />
      <Header />
      <main className="min-h-screen bg-background">
        <section className="bg-gradient-to-br from-primary-blue to-white text-white py-12">
          <div className="container-custom">
            <h1 className="text-4xl font-semibold mb-3 tracking-normal">Operators</h1>
            <p className="text-xl font-medium opacity-95">
              Browse {withStats.length} BTR property management operators
            </p>
          </div>
        </section>

        <div className="container-custom py-8">
          <FilterableOperatorList operators={withStats} />
        </div>
      </main>
      <Footer />
    </>
  );
}
