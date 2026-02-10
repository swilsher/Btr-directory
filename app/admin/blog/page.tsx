'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BlogPost, BlogCategory, CONTENT_TYPE_LABELS } from '@/types/blog';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2, Search, Star } from 'lucide-react';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'btr2025admin';

export default function AdminBlogPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
      fetchCategories();
    }
  }, [isAuthenticated, statusFilter, contentTypeFilter, categoryFilter, searchQuery]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
    } else {
      alert('Incorrect password');
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name');

    if (!error && data) {
      setCategories(data);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('blog_posts')
        .select('*, category:blog_categories(*)')
        .order('created_at', { ascending: false });

      if (statusFilter === 'published') {
        query = query.eq('is_published', true);
      } else if (statusFilter === 'draft') {
        query = query.eq('is_published', false);
      }

      if (contentTypeFilter) {
        query = query.eq('content_type', contentTypeFilter);
      }

      if (categoryFilter) {
        query = query.eq('category_id', categoryFilter);
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      const newPublishedState = !post.is_published;
      const updates: any = {
        is_published: newPublishedState,
      };

      // Set published_at when publishing for the first time
      if (newPublishedState && !post.published_at) {
        updates.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', post.id);

      if (error) throw error;

      // Update local state
      setPosts(prev => prev.map(p =>
        p.id === post.id
          ? { ...p, is_published: newPublishedState, published_at: updates.published_at || p.published_at }
          : p
      ));
    } catch (error) {
      console.error('Error toggling publish:', error);
      alert('Failed to update post status');
    }
  };

  const handleToggleFeatured = async (post: BlogPost) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ is_featured: !post.is_featured })
        .eq('id', post.id);

      if (error) throw error;

      setPosts(prev => prev.map(p =>
        p.id === post.id ? { ...p, is_featured: !p.is_featured } : p
      ));
    } catch (error) {
      console.error('Error toggling featured:', error);
      alert('Failed to update featured status');
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    setDeleting(postId);
    try {
      // First delete post tags
      await supabase
        .from('blog_post_tags')
        .delete()
        .eq('post_id', postId);

      // Then delete the post
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-semibold mb-6 text-center">Admin Login</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-primary-blue text-white py-3 rounded-lg font-semibold hover:bg-primary-blue-hover transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">Blog Management</h1>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/blog/new"
                className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-semibold hover:bg-primary-blue-hover transition-colors"
              >
                <Plus size={20} />
                New Post
              </Link>
              <button
                onClick={() => {
                  sessionStorage.removeItem('admin_authenticated');
                  setIsAuthenticated(false);
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Admin Navigation */}
          <div className="flex items-center gap-4 mb-4 text-sm">
            <Link href="/admin/verify" className="text-gray-600 hover:text-primary-blue transition-colors">
              Verify Developments
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/admin/developments" className="text-gray-600 hover:text-primary-blue transition-colors">
              Manage Developments
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-primary-blue font-medium">
              Blog Management
            </span>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-5 gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>

            <select
              value={contentTypeFilter}
              onChange={(e) => setContentTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
            >
              <option value="">All Types</option>
              <option value="blog">Blog Post</option>
              <option value="case-study">Case Study</option>
              <option value="market-report">Market Report</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <div className="col-span-2 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary-blue" size={48} />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg mb-4">No posts found</p>
            <Link
              href="/admin/blog/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-blue text-white rounded-lg font-semibold hover:bg-primary-blue-hover transition-colors"
            >
              <Plus size={20} />
              Create Your First Post
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {post.featured_image_url && (
                          <img
                            src={post.featured_image_url}
                            alt=""
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{post.title}</p>
                          <p className="text-sm text-gray-500">/insights/{post.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {CONTENT_TYPE_LABELS[post.content_type] || post.content_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {post.category?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          post.is_published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {post.is_published ? 'Published' : 'Draft'}
                        </span>
                        {post.is_featured && (
                          <Star size={16} className="text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {formatDate(post.published_at || post.created_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleFeatured(post)}
                          className={`p-2 rounded-lg transition-colors ${
                            post.is_featured
                              ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                              : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                          }`}
                          title={post.is_featured ? 'Remove from featured' : 'Mark as featured'}
                        >
                          <Star size={18} className={post.is_featured ? 'fill-current' : ''} />
                        </button>
                        <button
                          onClick={() => handleTogglePublish(post)}
                          className={`p-2 rounded-lg transition-colors ${
                            post.is_published
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={post.is_published ? 'Unpublish' : 'Publish'}
                        >
                          {post.is_published ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                        <Link
                          href={`/admin/blog/${post.id}/edit`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id)}
                          disabled={deleting === post.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === post.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Total Posts</p>
            <p className="text-2xl font-semibold">{posts.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Published</p>
            <p className="text-2xl font-semibold text-green-600">
              {posts.filter(p => p.is_published).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Drafts</p>
            <p className="text-2xl font-semibold text-yellow-600">
              {posts.filter(p => !p.is_published).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">Featured</p>
            <p className="text-2xl font-semibold text-blue-600">
              {posts.filter(p => p.is_featured).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
