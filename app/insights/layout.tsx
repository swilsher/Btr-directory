import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { SITE_URL, SITE_NAME } from '@/lib/constants';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata(): Promise<Metadata> {
  const { count } = await supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('is_published', true);

  const total = count || 0;

  return {
    title: 'BTR Insights | Industry News, Case Studies & Market Reports',
    description: `Stay informed with ${total}+ Build-to-Rent industry insights, expert analysis, case studies, and market reports from BTR Directory.`,
    alternates: {
      canonical: `${SITE_URL}/insights`,
    },
    openGraph: {
      title: 'BTR Insights | Industry News, Case Studies & Market Reports',
      description: `Stay informed with ${total}+ Build-to-Rent industry insights and market reports.`,
      url: `${SITE_URL}/insights`,
      siteName: SITE_NAME,
      locale: 'en_GB',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'BTR Insights | Industry News, Case Studies & Market Reports',
      description: 'Stay informed with the latest Build-to-Rent industry insights and market reports.',
    },
  };
}

export default function InsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
