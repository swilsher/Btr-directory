'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BlogCategory, BlogTag, BlogPostFormData } from '@/types/blog';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, Loader2, X } from 'lucide-react';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'btr2025admin';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 96);
}

export default function NewBlogPostPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);

  const [formData, setFormData] = useState<BlogPostFormData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image_url: '',
    category_id: '',
    content_type: 'blog',
    is_published: false,
    is_featured: false,
    published_at: '',
    tag_ids: [],
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
      fetchTags();
    }
  }, [isAuthenticated]);

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
    const { data } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name');
    if (data) setCategories(data);
  };

  const fetchTags = async () => {
    const { data } = await supabase
      .from('blog_tags')
      .select('*')
      .order('name');
    if (data) setTags(data);
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: slugManuallyEdited ? prev.slug : generateSlug(title),
    }));
  };

  const handleSlugChange = (slug: string) => {
    setSlugManuallyEdited(true);
    setFormData(prev => ({ ...prev, slug: generateSlug(slug) }));
  };

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter(id => id !== tagId)
        : [...prev.tag_ids, tagId],
    }));
  };

  const handleSubmit = async (publish: boolean = false) => {
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }
    if (!formData.slug.trim()) {
      alert('Slug is required');
      return;
    }

    setLoading(true);
    try {
      const postData: any = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        excerpt: formData.excerpt.trim() || null,
        content: formData.content.trim() || null,
        featured_image_url: formData.featured_image_url.trim() || null,
        category_id: formData.category_id || null,
        content_type: formData.content_type,
        is_published: publish || formData.is_published,
        is_featured: formData.is_featured,
      };

      // Set published_at if publishing
      if (publish || formData.is_published) {
        postData.published_at = formData.published_at || new Date().toISOString();
      }

      // Insert the post
      const { data: post, error: postError } = await supabase
        .from('blog_posts')
        .insert(postData)
        .select()
        .single();

      if (postError) throw postError;

      // Insert tags if any
      if (formData.tag_ids.length > 0 && post) {
        const tagInserts = formData.tag_ids.map(tagId => ({
          post_id: post.id,
          tag_id: tagId,
        }));

        const { error: tagError } = await supabase
          .from('blog_post_tags')
          .insert(tagInserts);

        if (tagError) {
          console.error('Error inserting tags:', tagError);
        }
      }

      router.push('/admin/blog');
    } catch (error: any) {
      console.error('Error creating post:', error);
      if (error.code === '23505') {
        alert('A post with this slug already exists. Please use a different slug.');
      } else {
        alert('Failed to create post: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
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
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/blog"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-xl font-semibold">Create New Post</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSubmit(false)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                Save Draft
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg font-medium hover:bg-primary-blue-hover transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} />}
                Publish
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Title */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Enter post title..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
              />
            </div>

            {/* Slug */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Slug *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">/insights/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="url-slug"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                />
              </div>
            </div>

            {/* Excerpt */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Excerpt
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Brief summary for listing pages and SEO (max 200 characters)
              </p>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Write a brief summary..."
                rows={3}
                maxLength={200}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {formData.excerpt.length}/200
              </p>
            </div>

            {/* Content */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content (Markdown)
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Write your content using Markdown formatting
              </p>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="# Heading&#10;&#10;Write your content here using **Markdown**..."
                rows={20}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Content Type */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Content Type *
              </label>
              <div className="space-y-2">
                {[
                  { value: 'blog', label: 'Blog Post' },
                  { value: 'case-study', label: 'Case Study' },
                  { value: 'market-report', label: 'Market Report' },
                ].map(type => (
                  <label key={type.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="content_type"
                      value={type.value}
                      checked={formData.content_type === type.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, content_type: e.target.value as any }))}
                      className="text-primary-blue focus:ring-primary-blue"
                    />
                    <span className="text-sm">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
              >
                <option value="">Select category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tags
              </label>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagToggle(tag.id)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        formData.tag_ids.includes(tag.id)
                          ? 'bg-primary-blue text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag.name}
                      {formData.tag_ids.includes(tag.id) && (
                        <X size={14} className="inline ml-1" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No tags available</p>
              )}
            </div>

            {/* Featured Image */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Featured Image URL
              </label>
              <input
                type="url"
                value={formData.featured_image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, featured_image_url: e.target.value }))}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
              />
              {formData.featured_image_url && (
                <img
                  src={formData.featured_image_url}
                  alt="Preview"
                  className="mt-3 w-full h-32 object-cover rounded-lg"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}
            </div>

            {/* Publishing Options */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Publishing Options
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                    className="text-primary-blue focus:ring-primary-blue rounded"
                  />
                  <span className="text-sm">Featured post</span>
                </label>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Publish Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.published_at ? formData.published_at.slice(0, 16) : ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      published_at: e.target.value ? new Date(e.target.value).toISOString() : ''
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
