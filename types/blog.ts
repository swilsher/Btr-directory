// Blog System TypeScript Interfaces

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at?: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  created_at?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  featured_image_url?: string;
  category_id?: string;
  category?: BlogCategory;
  content_type: 'blog' | 'case-study' | 'market-report';
  is_published: boolean;
  is_featured: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
  tags?: BlogTag[];
}

export interface BlogPostWithTags extends BlogPost {
  blog_post_tags?: { tag: BlogTag }[];
}

// Form data types for admin interface
export interface BlogPostFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string;
  category_id: string;
  content_type: 'blog' | 'case-study' | 'market-report';
  is_published: boolean;
  is_featured: boolean;
  published_at: string;
  tag_ids: string[];
}

// Content type labels for UI
export const CONTENT_TYPE_LABELS: Record<string, string> = {
  'blog': 'Blog Post',
  'case-study': 'Case Study',
  'market-report': 'Market Report',
};
