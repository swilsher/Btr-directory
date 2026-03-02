'use client';

import { useState, useEffect } from 'react';
import InsightCard from '@/components/cards/InsightCard';
import { BlogPost, BlogCategory } from '@/types/blog';
import { Search, Filter, BookOpen, FileText, BarChart3 } from 'lucide-react';

type ContentType = 'blog' | 'case-study' | 'market-report' | '';

const contentTypes: { value: ContentType; label: string; icon: React.ReactNode }[] = [
  { value: '', label: 'All Types', icon: null },
  { value: 'blog', label: 'Blog Posts', icon: <BookOpen size={16} /> },
  { value: 'case-study', label: 'Case Studies', icon: <FileText size={16} /> },
  { value: 'market-report', label: 'Market Reports', icon: <BarChart3 size={16} /> },
];

interface FilterableInsightListProps {
  posts: BlogPost[];
  categories: BlogCategory[];
}

export default function FilterableInsightList({ posts, categories }: FilterableInsightListProps) {
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>(posts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContentType, setSelectedContentType] = useState<ContentType>('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [itemsToShow, setItemsToShow] = useState(12);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let filtered = [...posts];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(search) ||
          p.excerpt?.toLowerCase().includes(search) ||
          p.category?.name.toLowerCase().includes(search)
      );
    }

    if (selectedContentType) {
      filtered = filtered.filter((p) => p.content_type === selectedContentType);
    }

    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category_id === selectedCategory);
    }

    setFilteredPosts(filtered);
    setItemsToShow(12);
  }, [searchTerm, selectedContentType, selectedCategory, posts]);

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setItemsToShow((prev) => prev + 12);
      setLoadingMore(false);
    }, 300);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedContentType('');
    setSelectedCategory('');
  };

  const hasActiveFilters = searchTerm || selectedContentType || selectedCategory;

  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-lg border border-border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={18} />
              <input
                type="text"
                placeholder="Search insights..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Content Type</label>
            <select
              value={selectedContentType}
              onChange={(e) => setSelectedContentType(e.target.value as ContentType)}
              className="input-field"
            >
              {contentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
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
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-primary-blue text-sm font-semibold hover:underline flex items-center"
          >
            <Filter size={14} className="mr-1" />
            Clear all filters
          </button>
        )}
      </div>

      {/* Content Type Quick Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {contentTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setSelectedContentType(type.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              selectedContentType === type.value
                ? 'bg-primary-blue text-white'
                : 'bg-white border border-border text-text-secondary hover:border-primary-blue hover:text-primary-blue'
            }`}
          >
            {type.icon}
            {type.label}
          </button>
        ))}
      </div>

      <div className="mb-6 text-text-secondary">
        Showing {Math.min(itemsToShow, filteredPosts.length)} of {filteredPosts.length} insights
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-border">
          <p className="text-text-secondary text-lg">No insights found matching your criteria.</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-primary-blue font-semibold hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.slice(0, itemsToShow).map((post) => (
            <InsightCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {itemsToShow < filteredPosts.length && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="bg-primary-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-blue-hover transition-all duration-200 disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More Insights'}
          </button>
        </div>
      )}
    </>
  );
}
