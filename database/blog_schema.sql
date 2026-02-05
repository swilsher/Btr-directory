-- =============================================
-- BTR Directory Blog Schema
-- Run this SQL in Supabase SQL Editor
-- =============================================

-- Blog Categories
CREATE TABLE blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog Tags
CREATE TABLE blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog Posts
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  featured_image_url TEXT,
  category_id UUID REFERENCES blog_categories(id),
  content_type TEXT DEFAULT 'blog' CHECK (content_type IN ('blog', 'case-study', 'market-report')),
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog Post Tags (many-to-many junction table)
CREATE TABLE blog_post_tags (
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;

-- Public read access for published posts only
CREATE POLICY "Public can view published posts" ON blog_posts
  FOR SELECT USING (is_published = true);

-- Public read access for categories and tags
CREATE POLICY "Public can view categories" ON blog_categories
  FOR SELECT USING (true);

CREATE POLICY "Public can view tags" ON blog_tags
  FOR SELECT USING (true);

CREATE POLICY "Public can view post tags" ON blog_post_tags
  FOR SELECT USING (true);

-- Admin full access (for insert/update/delete operations)
-- These policies allow all operations - admin auth is handled at app level
CREATE POLICY "Allow insert posts" ON blog_posts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update posts" ON blog_posts
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete posts" ON blog_posts
  FOR DELETE USING (true);

CREATE POLICY "Allow insert categories" ON blog_categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update categories" ON blog_categories
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete categories" ON blog_categories
  FOR DELETE USING (true);

CREATE POLICY "Allow insert tags" ON blog_tags
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update tags" ON blog_tags
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete tags" ON blog_tags
  FOR DELETE USING (true);

CREATE POLICY "Allow insert post_tags" ON blog_post_tags
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow delete post_tags" ON blog_post_tags
  FOR DELETE USING (true);

-- =============================================
-- Indexes for Performance
-- =============================================

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON blog_posts(is_published, published_at DESC);
CREATE INDEX idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX idx_blog_posts_content_type ON blog_posts(content_type);
CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX idx_blog_tags_slug ON blog_tags(slug);

-- =============================================
-- Initial Categories (Optional - run after tables are created)
-- =============================================

INSERT INTO blog_categories (name, slug, description) VALUES
  ('Market Analysis', 'market-analysis', 'Market trends and data analysis'),
  ('Development News', 'development-news', 'New BTR development announcements'),
  ('Investment', 'investment', 'Investment and finance topics'),
  ('Operations', 'operations', 'Property management insights'),
  ('Technology', 'technology', 'PropTech and innovation'),
  ('Sustainability', 'sustainability', 'ESG and green initiatives'),
  ('Policy & Regulation', 'policy-regulation', 'Legal and regulatory updates');
