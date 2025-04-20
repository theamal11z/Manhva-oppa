-- Enable Row Level Security on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manga_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reading_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "User profiles are viewable by everyone" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins table is viewable by everyone" ON public.admins;
DROP POLICY IF EXISTS "Only authenticated users can attempt to insert admin records" ON public.admins;
DROP POLICY IF EXISTS "Admins can only delete their own records" ON public.admins;
DROP POLICY IF EXISTS "No updates to admin records" ON public.admins;
DROP POLICY IF EXISTS "Genres are viewable by everyone" ON public.genres;
DROP POLICY IF EXISTS "Only admins can manage genres" ON public.genres;
DROP POLICY IF EXISTS "Tags are viewable by everyone" ON public.tags;
DROP POLICY IF EXISTS "Only admins can manage tags" ON public.tags;
DROP POLICY IF EXISTS "Manga entries are viewable by everyone" ON public.manga_entries;
DROP POLICY IF EXISTS "Only admins can manage manga entries" ON public.manga_entries;
DROP POLICY IF EXISTS "Manga genres are viewable by everyone" ON public.manga_genres;
DROP POLICY IF EXISTS "Only admins can manage manga genres" ON public.manga_genres;
DROP POLICY IF EXISTS "Manga tags are viewable by everyone" ON public.manga_tags;
DROP POLICY IF EXISTS "Only admins can manage manga tags" ON public.manga_tags;
DROP POLICY IF EXISTS "Chapters are viewable by everyone" ON public.chapters;
DROP POLICY IF EXISTS "Only admins can manage chapters" ON public.chapters;
DROP POLICY IF EXISTS "Chapter pages are viewable by everyone" ON public.chapter_pages;
DROP POLICY IF EXISTS "Only admins can manage chapter pages" ON public.chapter_pages;
DROP POLICY IF EXISTS "Users can view their own reading lists" ON public.user_reading_lists;
DROP POLICY IF EXISTS "Users can manage their own reading lists" ON public.user_reading_lists;
DROP POLICY IF EXISTS "Admins can view all reading lists" ON public.user_reading_lists;
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Admins can view all favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Users can view their own reading history" ON public.reading_history;
DROP POLICY IF EXISTS "Users can manage their own reading history" ON public.reading_history;
DROP POLICY IF EXISTS "Admins can view all reading history" ON public.reading_history;
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Admins can view all preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Users can manage their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Users can manage their own comments" ON public.comments;
DROP POLICY IF EXISTS "Admins can manage all comments" ON public.comments;

-- User Profiles policies
-- Anyone can view user profiles
CREATE POLICY "User profiles are viewable by everyone" 
ON public.user_profiles FOR SELECT USING (true);

-- Users can update their own profiles
CREATE POLICY "Users can update their own profiles" 
ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profiles
CREATE POLICY "Users can insert their own profiles" 
ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins policies
-- Anyone can view the admins table (no sensitive data, just user-admin mappings)
CREATE POLICY "Admins table is viewable by everyone" 
ON public.admins FOR SELECT USING (true);

-- Only authenticated users can try to insert records
-- Note: You would typically handle admin creation through a secure API endpoint
-- with additional business logic, not through direct table access
CREATE POLICY "Only authenticated users can attempt to insert admin records" 
ON public.admins FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only the admin user themselves can remove their own admin status
CREATE POLICY "Admins can only delete their own records" 
ON public.admins FOR DELETE USING (auth.uid() = user_id);

-- No direct updates to admin records
CREATE POLICY "No updates to admin records" 
ON public.admins FOR UPDATE USING (false);

-- Genres policies
-- Anyone can view genres
CREATE POLICY "Genres are viewable by everyone" 
ON public.genres FOR SELECT USING (true);

-- For INSERT/UPDATE/DELETE operations, create a function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only admins can insert/update/delete genres
CREATE POLICY "Only admins can manage genres" 
ON public.genres FOR ALL USING (
  public.is_admin()
);

-- Tags policies
-- Anyone can view tags
CREATE POLICY "Tags are viewable by everyone" 
ON public.tags FOR SELECT USING (true);

-- Only admins can insert/update/delete tags
CREATE POLICY "Only admins can manage tags" 
ON public.tags FOR ALL USING (
  public.is_admin()
);

-- Manga entries policies
-- Anyone can view manga entries
CREATE POLICY "Manga entries are viewable by everyone" 
ON public.manga_entries FOR SELECT USING (true);

-- Only admins can insert/update/delete manga entries
CREATE POLICY "Only admins can manage manga entries" 
ON public.manga_entries FOR ALL USING (
  public.is_admin()
);

-- Manga genres policies
-- Anyone can view manga genres
CREATE POLICY "Manga genres are viewable by everyone" 
ON public.manga_genres FOR SELECT USING (true);

-- Only admins can insert/update/delete manga genres
CREATE POLICY "Only admins can manage manga genres" 
ON public.manga_genres FOR ALL USING (
  public.is_admin()
);

-- Manga tags policies
-- Anyone can view manga tags
CREATE POLICY "Manga tags are viewable by everyone" 
ON public.manga_tags FOR SELECT USING (true);

-- Only admins can insert/update/delete manga tags
CREATE POLICY "Only admins can manage manga tags" 
ON public.manga_tags FOR ALL USING (
  public.is_admin()
);

-- Chapters policies
-- Anyone can view chapters
CREATE POLICY "Chapters are viewable by everyone" 
ON public.chapters FOR SELECT USING (true);

-- Only admins can insert/update/delete chapters
CREATE POLICY "Only admins can manage chapters" 
ON public.chapters FOR ALL USING (
  public.is_admin()
);

-- Chapter pages policies
-- Anyone can view chapter pages
CREATE POLICY "Chapter pages are viewable by everyone" 
ON public.chapter_pages FOR SELECT USING (true);

-- Only admins can insert/update/delete chapter pages
CREATE POLICY "Only admins can manage chapter pages" 
ON public.chapter_pages FOR ALL USING (
  public.is_admin()
);

-- User reading lists policies
-- Users can view their own reading lists
CREATE POLICY "Users can view their own reading lists" 
ON public.user_reading_lists FOR SELECT USING (auth.uid() = user_id);

-- Users can insert/update/delete their own reading lists
CREATE POLICY "Users can manage their own reading lists" 
ON public.user_reading_lists FOR ALL USING (auth.uid() = user_id);

-- Admins can view all reading lists
CREATE POLICY "Admins can view all reading lists" 
ON public.user_reading_lists FOR SELECT USING (
  public.is_admin()
);

-- User favorites policies
-- Users can view their own favorites
CREATE POLICY "Users can view their own favorites" 
ON public.user_favorites FOR SELECT USING (auth.uid() = user_id);

-- Users can insert/update/delete their own favorites
CREATE POLICY "Users can manage their own favorites" 
ON public.user_favorites FOR ALL USING (auth.uid() = user_id);

-- Admins can view all favorites
CREATE POLICY "Admins can view all favorites" 
ON public.user_favorites FOR SELECT USING (
  public.is_admin()
);

-- Reading history policies
-- Users can view their own reading history
CREATE POLICY "Users can view their own reading history" 
ON public.reading_history FOR SELECT USING (auth.uid() = user_id);

-- Users can insert/update their own reading history
CREATE POLICY "Users can manage their own reading history" 
ON public.reading_history FOR ALL USING (auth.uid() = user_id);

-- Admins can view all reading history
CREATE POLICY "Admins can view all reading history" 
ON public.reading_history FOR SELECT USING (
  public.is_admin()
);

-- User preferences policies
-- Users can view their own preferences
CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);

-- Users can insert/update their own preferences
CREATE POLICY "Users can manage their own preferences" 
ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

-- Admins can view all preferences
CREATE POLICY "Admins can view all preferences" 
ON public.user_preferences FOR SELECT USING (
  public.is_admin()
);

-- Reviews policies
-- Anyone can view reviews
CREATE POLICY "Reviews are viewable by everyone" 
ON public.reviews FOR SELECT USING (true);

-- Users can insert/update/delete their own reviews
CREATE POLICY "Users can manage their own reviews" 
ON public.reviews FOR ALL USING (auth.uid() = user_id);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews" 
ON public.reviews FOR ALL USING (
  public.is_admin()
);

-- Comments policies
-- Anyone can view comments
CREATE POLICY "Comments are viewable by everyone" 
ON public.comments FOR SELECT USING (true);

-- Users can insert/update/delete their own comments
CREATE POLICY "Users can manage their own comments" 
ON public.comments FOR ALL USING (auth.uid() = user_id);

-- Admins can manage all comments
CREATE POLICY "Admins can manage all comments" 
ON public.comments FOR ALL USING (
  public.is_admin()
);
