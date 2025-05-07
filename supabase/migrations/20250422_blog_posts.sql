-- Create the blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  published_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  manga_id UUID REFERENCES manga_entries(id) ON DELETE CASCADE,
  featured_image TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS blog_posts_manga_id_idx ON blog_posts(manga_id);
CREATE INDEX IF NOT EXISTS blog_posts_slug_idx ON blog_posts(slug);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create a trigger to call the function
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON blog_posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for blog_posts
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Policy for anonymous users (can only read published blog posts)
CREATE POLICY blog_posts_anon_read_policy
ON blog_posts FOR SELECT
TO anon
USING (true); -- All blog posts are readable by anonymous users

-- Policy for authenticated users (can read all blog posts)
CREATE POLICY blog_posts_auth_read_policy
ON blog_posts FOR SELECT
TO authenticated
USING (true);

-- Policy for admin users (can insert, update, delete blog posts)
CREATE POLICY blog_posts_admin_write_policy
ON blog_posts FOR ALL
TO authenticated
USING (
  auth.uid() IN (SELECT user_id FROM admins)
)
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM admins)
);
