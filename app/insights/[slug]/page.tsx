import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import InsightCard from '@/components/cards/InsightCard';
import ReactMarkdown from 'react-markdown';
import { createClient } from '@supabase/supabase-js';
import { BlogPost, BlogTag, CONTENT_TYPE_LABELS } from '@/types/blog';
import { Calendar, Tag, ArrowLeft, BookOpen, FileText, BarChart3 } from 'lucide-react';

// Create a server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PageProps {
  params: Promise<{ slug: string }>;
}

const contentTypeColors: Record<string, string> = {
  'blog': 'bg-blue-100 text-blue-800',
  'case-study': 'bg-purple-100 text-purple-800',
  'market-report': 'bg-green-100 text-green-800',
};

const contentTypeIcons: Record<string, React.ReactNode> = {
  'blog': <BookOpen size={18} />,
  'case-study': <FileText size={18} />,
  'market-report': <BarChart3 size={18} />,
};

async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*, category:blog_categories(*)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error || !data) return null;

  // Fetch tags for this post
  const { data: postTags } = await supabase
    .from('blog_post_tags')
    .select('tag:blog_tags(*)')
    .eq('post_id', data.id);

  const tags = postTags?.map((pt: any) => pt.tag).filter(Boolean) || [];

  return { ...data, tags };
}

async function getRelatedPosts(categoryId: string, excludeId: string): Promise<BlogPost[]> {
  const { data } = await supabase
    .from('blog_posts')
    .select('*, category:blog_categories(*)')
    .eq('is_published', true)
    .eq('category_id', categoryId)
    .neq('id', excludeId)
    .order('published_at', { ascending: false })
    .limit(3);

  return data || [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: 'Insight Not Found' };
  }

  const description = post.excerpt || `${post.title} - ${CONTENT_TYPE_LABELS[post.content_type]} from UK BTR Directory`;
  const imageUrl = post.featured_image_url;

  return {
    title: `${post.title} | BTR Insights`,
    description: description.substring(0, 160),
    keywords: [
      post.title,
      CONTENT_TYPE_LABELS[post.content_type],
      post.category?.name || '',
      'BTR insights',
      'build to rent',
      ...(post.tags?.map((t) => t.name) || []),
    ],
    alternates: {
      canonical: `https://ukbtrdirectory.com/insights/${slug}`,
    },
    openGraph: {
      title: post.title,
      description,
      url: `https://ukbtrdirectory.com/insights/${slug}`,
      siteName: 'UK BTR Directory',
      locale: 'en_GB',
      type: 'article',
      publishedTime: post.published_at || undefined,
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: post.title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function InsightDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Fetch related posts
  const relatedPosts = post.category_id
    ? await getRelatedPosts(post.category_id, post.id)
    : [];

  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-blue to-white text-white py-12">
          <div className="container-custom">
            <Link
              href="/insights"
              className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to Insights
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <Badge className={contentTypeColors[post.content_type]}>
                <span className="flex items-center gap-1.5">
                  {contentTypeIcons[post.content_type]}
                  {CONTENT_TYPE_LABELS[post.content_type]}
                </span>
              </Badge>
              {post.is_featured && (
                <Badge variant="success">Featured</Badge>
              )}
            </div>

            <h1 className="text-4xl font-semibold mb-4 tracking-normal max-w-4xl">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-white/90">
              {publishedDate && (
                <span className="flex items-center">
                  <Calendar size={16} className="mr-2" />
                  {publishedDate}
                </span>
              )}
              {post.category && (
                <span className="flex items-center">
                  <Tag size={16} className="mr-2" />
                  {post.category.name}
                </span>
              )}
            </div>
          </div>
        </section>

        <div className="container-custom py-8">
          <div className="max-w-4xl mx-auto">
            {/* Featured Image */}
            {post.featured_image_url && (
              <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Excerpt */}
            {post.excerpt && (
              <div className="bg-primary-blue-light rounded-lg p-6 mb-8">
                <p className="text-lg text-text-primary font-medium leading-relaxed">
                  {post.excerpt}
                </p>
              </div>
            )}

            {/* Article Body */}
            <article className="bg-white rounded-lg border border-border p-8">
              <div className="prose prose-lg max-w-none text-text-primary">
                {post.content && (
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-3xl font-semibold mt-8 mb-4">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-2xl font-semibold mt-8 mb-4">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xl font-semibold mt-6 mb-3">{children}</h3>,
                      h4: ({ children }) => <h4 className="text-lg font-semibold mt-6 mb-3">{children}</h4>,
                      p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary-blue pl-4 my-6 italic text-text-secondary">
                          {children}
                        </blockquote>
                      ),
                      ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>,
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-blue hover:underline font-semibold"
                        >
                          {children}
                        </a>
                      ),
                      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      img: ({ src, alt }) => (
                        <div className="my-8">
                          <img
                            src={src}
                            alt={alt || 'Article image'}
                            className="w-full rounded-lg shadow-md"
                          />
                          {alt && (
                            <p className="text-sm text-text-secondary text-center mt-2">{alt}</p>
                          )}
                        </div>
                      ),
                      code: ({ children }) => (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">{children}</code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4">{children}</pre>
                      ),
                    }}
                  >
                    {post.content}
                  </ReactMarkdown>
                )}
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-8 pt-8 border-t border-border">
                  <h3 className="text-lg font-semibold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Badge key={tag.id} variant="default">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-semibold mb-6">Related Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedPosts.map((related) => (
                    <InsightCard key={related.id} post={related} />
                  ))}
                </div>
              </div>
            )}

            {/* Back to Insights CTA */}
            <div className="mt-12 bg-gradient-to-r from-primary-blue to-blue-400 rounded-2xl p-8 text-center text-white">
              <h2 className="text-2xl font-semibold mb-3">Explore More Insights</h2>
              <p className="font-medium opacity-95 mb-6">
                Stay up to date with the latest BTR industry news and analysis
              </p>
              <Link href="/insights">
                <Button variant="secondary" className="bg-white text-primary-blue hover:bg-gray-100 border-white">
                  Browse All Insights
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
