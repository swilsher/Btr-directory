import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { BlogPost, CONTENT_TYPE_LABELS } from '@/types/blog';
import { Calendar, Tag, BookOpen, FileText, BarChart3 } from 'lucide-react';

interface InsightCardProps {
  post: BlogPost;
}

const contentTypeColors: Record<string, string> = {
  'blog': 'bg-blue-100 text-blue-800',
  'case-study': 'bg-purple-100 text-purple-800',
  'market-report': 'bg-green-100 text-green-800',
};

const contentTypeIcons: Record<string, React.ReactNode> = {
  'blog': <BookOpen size={14} />,
  'case-study': <FileText size={14} />,
  'market-report': <BarChart3 size={14} />,
};

export default function InsightCard({ post }: InsightCardProps) {
  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <Link href={`/insights/${post.slug}`}>
      <Card className="h-full flex flex-col">
        {/* Image */}
        {post.featured_image_url && (
          <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            {post.is_featured && (
              <div className="absolute top-3 right-3">
                <Badge variant="success" className="text-xs">Featured</Badge>
              </div>
            )}
          </div>
        )}

        <div className="p-6 flex-1 flex flex-col">
          {/* Content Type Badge */}
          <div className="flex items-center justify-between mb-3">
            <Badge className={`${contentTypeColors[post.content_type]} text-xs`}>
              <span className="flex items-center gap-1">
                {contentTypeIcons[post.content_type]}
                {CONTENT_TYPE_LABELS[post.content_type]}
              </span>
            </Badge>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-text-primary mb-2 line-clamp-2">
            {post.title}
          </h3>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-text-secondary text-sm mb-4 line-clamp-3 font-medium flex-1">
              {post.excerpt}
            </p>
          )}

          {/* Meta Info */}
          <div className="mt-auto space-y-2 text-sm border-t border-border pt-4">
            <div className="flex items-center justify-between">
              {publishedDate && (
                <span className="text-text-secondary flex items-center">
                  <Calendar size={14} className="mr-1" />
                  {publishedDate}
                </span>
              )}
              {post.category && (
                <span className="text-primary-blue flex items-center font-medium">
                  <Tag size={14} className="mr-1" />
                  {post.category.name}
                </span>
              )}
            </div>
          </div>

          {/* Tags Preview */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs bg-primary-blue-light text-primary-blue px-2 py-1 rounded"
                >
                  {tag.name}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="text-xs text-text-muted">+{post.tags.length - 3} more</span>
              )}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
