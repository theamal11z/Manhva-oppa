export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      admins: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      genres: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      manga_entries: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          cover_image: string | null;
          author: string | null;
          artist: string | null;
          status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
          type: 'manga' | 'manhwa' | 'manhua' | 'webtoon' | 'light_novel';
          year: number | null;
          popularity: number;
          total_chapters: number;
          rating: number | null;
          age_rating: 'all' | '13+' | '16+' | '18+';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          cover_image?: string | null;
          author?: string | null;
          artist?: string | null;
          status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
          type: 'manga' | 'manhwa' | 'manhua' | 'webtoon' | 'light_novel';
          year?: number | null;
          popularity?: number;
          total_chapters?: number;
          rating?: number | null;
          age_rating?: 'all' | '13+' | '16+' | '18+';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          cover_image?: string | null;
          author?: string | null;
          artist?: string | null;
          status?: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
          type?: 'manga' | 'manhwa' | 'manhua' | 'webtoon' | 'light_novel';
          year?: number | null;
          popularity?: number;
          total_chapters?: number;
          rating?: number | null;
          age_rating?: 'all' | '13+' | '16+' | '18+';
          created_at?: string;
          updated_at?: string;
        };
      };
      manga_genres: {
        Row: {
          id: string;
          manga_id: string;
          genre_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          manga_id: string;
          genre_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          manga_id?: string;
          genre_id?: string;
          created_at?: string;
        };
      };
      manga_tags: {
        Row: {
          id: string;
          manga_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          manga_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          manga_id?: string;
          tag_id?: string;
          created_at?: string;
        };
      };
      chapters: {
        Row: {
          id: string;
          manga_id: string;
          chapter_number: number;
          title: string | null;
          pages: number;
          views: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          manga_id: string;
          chapter_number: number;
          title?: string | null;
          pages?: number;
          views?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          manga_id?: string;
          chapter_number?: number;
          title?: string | null;
          pages?: number;
          views?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      chapter_pages: {
        Row: {
          id: string;
          chapter_id: string;
          page_number: number;
          image_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          chapter_id: string;
          page_number: number;
          image_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          chapter_id?: string;
          page_number?: number;
          image_url?: string;
          created_at?: string;
        };
      };
      user_reading_lists: {
        Row: {
          id: string;
          user_id: string;
          manga_id: string;
          status: 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read';
          current_chapter: number | null;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          manga_id: string;
          status: 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read';
          current_chapter?: number | null;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          manga_id?: string;
          status?: 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read';
          current_chapter?: number | null;
          updated_at?: string;
          created_at?: string;
        };
      };
      user_favorites: {
        Row: {
          id: string;
          user_id: string;
          manga_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          manga_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          manga_id?: string;
          created_at?: string;
        };
      };
      reading_history: {
        Row: {
          id: string;
          user_id: string;
          chapter_id: string;
          manga_id: string;
          read_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          chapter_id: string;
          manga_id: string;
          read_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          chapter_id?: string;
          manga_id?: string;
          read_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          favorite_genres: Json;
          disliked_genres: Json;
          favorite_tags: Json;
          disliked_tags: Json;
          age_preference: 'all' | '13+' | '16+' | '18+' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          favorite_genres?: Json;
          disliked_genres?: Json;
          favorite_tags?: Json;
          disliked_tags?: Json;
          age_preference?: 'all' | '13+' | '16+' | '18+' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          favorite_genres?: Json;
          disliked_genres?: Json;
          favorite_tags?: Json;
          disliked_tags?: Json;
          age_preference?: 'all' | '13+' | '16+' | '18+' | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          manga_id: string;
          rating: number;
          content: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          manga_id: string;
          rating: number;
          content?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          manga_id?: string;
          rating?: number;
          content?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          user_id: string;
          manga_id: string;
          chapter_id: string | null;
          parent_id: string | null;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          manga_id: string;
          chapter_id?: string | null;
          parent_id?: string | null;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          manga_id?: string;
          chapter_id?: string | null;
          parent_id?: string | null;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
