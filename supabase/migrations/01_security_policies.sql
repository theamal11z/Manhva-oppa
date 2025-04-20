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
-- Only admins can view the admins table
CREATE POLICY "Only admins can view admins" 
ON public.admins FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM public.admins)
);

-- Only authenticated users who are admins can insert/update/delete
CREATE POLICY "Only super admins can manage admins" 
ON public.admins FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM public.admins)
);

-- Genres policies
-- Anyone can view genres
CREATE POLICY "Genres are viewable by everyone" 
ON public.genres FOR SELECT USING (true);

-- Only admins can insert/update/delete genres
CREATE POLICY "Only admins can manage genres" 
ON public.genres FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM public.admins)
);

-- Tags policies
-- Anyone can view tags
CREATE POLICY "Tags are viewable by everyone" 
ON public.tags FOR SELECT USING (true);

-- Only admins can insert/update/delete tags
CREATE POLICY "Only admins can manage tags" 
ON public.tags FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM public.admins)
);

-- Manga entries policies
-- Anyone can view manga entries
CREATE POLICY "Manga entries are viewable by everyone" 
ON public.manga_entries FOR SELECT USING (true);

-- Only admins can insert/update/delete manga entries
CREATE POLICY "Only admins can manage manga entries" 
ON public.manga_entries FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM public.admins)
);

-- Manga genres policies
-- Anyone can view manga genres
CREATE POLICY "Manga genres are viewable by everyone" 
ON public.manga_genres FOR SELECT USING (true);

-- Only admins can insert/update/delete manga genres
CREATE POLICY "Only admins can manage manga genres" 
ON public.manga_genres FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM public.admins)
);

-- Manga tags policies
-- Anyone can view manga tags
CREATE POLICY "Manga tags are viewable by everyone" 
ON public.manga_tags FOR SELECT USING (true);

-- Only admins can insert/update/delete manga tags
CREATE POLICY "Only admins can manage manga tags" 
ON public.manga_tags FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM public.admins)
);

-- Chapters policies
-- Anyone can view chapters
CREATE POLICY "Chapters are viewable by everyone" 
ON public.chapters FOR SELECT USING (true);

-- Only admins can insert/update/delete chapters
CREATE POLICY "Only admins can manage chapters" 
ON public.chapters FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM public.admins)
);

-- Chapter pages policies
-- Anyone can view chapter pages
CREATE POLICY "Chapter pages are viewable by everyone" 
ON public.chapter_pages FOR SELECT USING (true);

-- Only admins can insert/update/delete chapter pages
CREATE POLICY "Only admins can manage chapter pages" 
ON public.chapter_pages FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM public.admins)
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
  auth.uid() IN (SELECT user_id FROM public.admins)
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
  auth.uid() IN (SELECT user_id FROM public.admins)
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
  auth.uid() IN (SELECT user_id FROM public.admins)
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
  auth.uid() IN (SELECT user_id FROM public.admins)
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
  auth.uid() IN (SELECT user_id FROM public.admins)
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
  auth.uid() IN (SELECT user_id FROM public.admins)
);
