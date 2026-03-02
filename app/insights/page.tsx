import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FilterableInsightList from '@/components/filterable/FilterableInsightList';
import { supabase } from '@/lib/supabase';

export const revalidate = 60;

export default async function InsightsPage() {
  const [postsResult, categoriesResult] = await Promise.all([
    supabase
      .from('blog_posts')
      .select('*, category:blog_categories(*)')
      .eq('is_published', true)
      .order('published_at', { ascending: false }),
    supabase
      .from('blog_categories')
      .select('*')
      .order('name'),
  ]);

  const posts = postsResult.data || [];
  const categories = categoriesResult.data || [];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-blue to-white text-white py-12">
          <div className="container-custom">
            <h1 className="text-4xl font-semibold mb-3 tracking-normal">BTR Insights</h1>
            <p className="text-xl font-medium opacity-95">
              Industry analysis, case studies, and market reports for the UK Build-to-Rent sector
            </p>
          </div>
        </section>

        <div className="container-custom py-8">
          <FilterableInsightList posts={posts} categories={categories} />
        </div>
      </main>
      <Footer />
    </>
  );
}
