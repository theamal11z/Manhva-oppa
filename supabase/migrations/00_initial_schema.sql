-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: JWT secret is configured through Supabase dashboard, not via SQL
-- Attempting to set app.jwt_secret directly will result in permission errors

-------------
-- SCHEMAS --
-------------

-- Create a schema for public tables
CREATE SCHEMA IF NOT EXISTS public;

-- Create a schema for auth-related tables
CREATE SCHEMA IF NOT EXISTS auth;

-- Create a schema for storage-related tables
CREATE SCHEMA IF NOT EXISTS storage;

-------------
-- TABLES --
-------------

-- Users Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 25),
  CONSTRAINT username_format CHECK (username ~* '^[a-zA-Z0-9_]+$')
);

COMMENT ON TABLE public.user_profiles IS 'User profile information extending the auth.users table';

-- Admin users
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  CONSTRAINT unique_admin_user UNIQUE (user_id)
);

COMMENT ON TABLE public.admins IS 'Administrators with special privileges';

-- Genres
CREATE TABLE IF NOT EXISTS public.genres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.genres IS 'Manga genres like Action, Romance, etc.';

-- Tags
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.tags IS 'Tags for manga like "Time Travel", "Reincarnation", etc.';

-- Manga entries
CREATE TABLE IF NOT EXISTS public.manga_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  author TEXT,
  artist TEXT,
  status TEXT CHECK (status IN ('ongoing', 'completed', 'hiatus', 'cancelled')),
  type TEXT CHECK (type IN ('manga', 'manhwa', 'manhua', 'webtoon', 'light_novel')),
  year INTEGER,
  popularity INTEGER DEFAULT 0,
  total_chapters INTEGER DEFAULT 0,
  rating NUMERIC(3, 2) CHECK (rating >= 0 AND rating <= 5),
  age_rating TEXT CHECK (age_rating IN ('all', '13+', '16+', '18+')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_manga_title ON public.manga_entries(title);
CREATE INDEX IF NOT EXISTS idx_manga_popularity ON public.manga_entries(popularity);
CREATE INDEX IF NOT EXISTS idx_manga_rating ON public.manga_entries(rating);
CREATE INDEX IF NOT EXISTS idx_manga_year ON public.manga_entries(year);

COMMENT ON TABLE public.manga_entries IS 'Main table for manga titles';

-- Manga-Genre relationship (many-to-many)
CREATE TABLE IF NOT EXISTS public.manga_genres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manga_id UUID NOT NULL REFERENCES public.manga_entries(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES public.genres(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  CONSTRAINT unique_manga_genre UNIQUE (manga_id, genre_id)
);

CREATE INDEX IF NOT EXISTS idx_manga_genres_manga_id ON public.manga_genres(manga_id);
CREATE INDEX IF NOT EXISTS idx_manga_genres_genre_id ON public.manga_genres(genre_id);

COMMENT ON TABLE public.manga_genres IS 'Association table linking manga with genres';

-- Manga-Tag relationship (many-to-many)
CREATE TABLE IF NOT EXISTS public.manga_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manga_id UUID NOT NULL REFERENCES public.manga_entries(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  CONSTRAINT unique_manga_tag UNIQUE (manga_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_manga_tags_manga_id ON public.manga_tags(manga_id);
CREATE INDEX IF NOT EXISTS idx_manga_tags_tag_id ON public.manga_tags(tag_id);

COMMENT ON TABLE public.manga_tags IS 'Association table linking manga with tags';

-- Chapters
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manga_id UUID NOT NULL REFERENCES public.manga_entries(id) ON DELETE CASCADE,
  chapter_number NUMERIC(8, 2) NOT NULL,
  title TEXT,
  pages INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  CONSTRAINT unique_manga_chapter UNIQUE (manga_id, chapter_number)
);

CREATE INDEX IF NOT EXISTS idx_chapters_manga_id ON public.chapters(manga_id);
CREATE INDEX IF NOT EXISTS idx_chapters_chapter_number ON public.chapters(chapter_number);

COMMENT ON TABLE public.chapters IS 'Manga chapters';

-- Chapter pages
CREATE TABLE IF NOT EXISTS public.chapter_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  CONSTRAINT unique_chapter_page UNIQUE (chapter_id, page_number)
);

CREATE INDEX IF NOT EXISTS idx_chapter_pages_chapter_id ON public.chapter_pages(chapter_id);

COMMENT ON TABLE public.chapter_pages IS 'Individual pages of a manga chapter';

-- User reading lists
CREATE TABLE IF NOT EXISTS public.user_reading_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manga_id UUID NOT NULL REFERENCES public.manga_entries(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('reading', 'completed', 'on_hold', 'dropped', 'plan_to_read')),
  current_chapter NUMERIC(8, 2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  CONSTRAINT unique_user_manga UNIQUE (user_id, manga_id)
);

CREATE INDEX IF NOT EXISTS idx_reading_lists_user_id ON public.user_reading_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_lists_manga_id ON public.user_reading_lists(manga_id);
CREATE INDEX IF NOT EXISTS idx_reading_lists_status ON public.user_reading_lists(status);

COMMENT ON TABLE public.user_reading_lists IS 'Users reading lists';

-- User favorites
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manga_id UUID NOT NULL REFERENCES public.manga_entries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  CONSTRAINT unique_user_favorite UNIQUE (user_id, manga_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_manga_id ON public.user_favorites(manga_id);

COMMENT ON TABLE public.user_favorites IS 'Users favorite manga';

-- Reading history for recommendation engine
CREATE TABLE IF NOT EXISTS public.reading_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  manga_id UUID NOT NULL REFERENCES public.manga_entries(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  CONSTRAINT unique_user_chapter_read UNIQUE (user_id, chapter_id)
);

CREATE INDEX IF NOT EXISTS idx_history_user_id ON public.reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_manga_id ON public.reading_history(manga_id);
CREATE INDEX IF NOT EXISTS idx_history_read_at ON public.reading_history(read_at);

COMMENT ON TABLE public.reading_history IS 'User reading history for recommendations';

-- User preferences for recommendations
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_genres JSONB DEFAULT '[]'::jsonb,
  disliked_genres JSONB DEFAULT '[]'::jsonb,
  favorite_tags JSONB DEFAULT '[]'::jsonb,
  disliked_tags JSONB DEFAULT '[]'::jsonb,
  age_preference TEXT CHECK (age_preference IN ('all', '13+', '16+', '18+')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

COMMENT ON TABLE public.user_preferences IS 'User preferences for recommendation engine';

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manga_id UUID NOT NULL REFERENCES public.manga_entries(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  CONSTRAINT unique_user_manga_review UNIQUE (user_id, manga_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_manga_id ON public.reviews(manga_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

COMMENT ON TABLE public.reviews IS 'User reviews of manga titles';

-- Comments
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manga_id UUID NOT NULL REFERENCES public.manga_entries(id),
  chapter_id UUID REFERENCES public.chapters(id),
  parent_id UUID REFERENCES public.comments(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_manga_id ON public.comments(manga_id);
CREATE INDEX IF NOT EXISTS idx_comments_chapter_id ON public.comments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

COMMENT ON TABLE public.comments IS 'User comments on manga and chapters';
