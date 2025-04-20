import { createClient } from '@supabase/supabase-js';
// Import the Database type when we have proper Supabase schema defined
// For now using any type to avoid compilation errors
type Database = any;

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// User authentication helpers
export const signUp = async (email: string, password: string) => {
  return supabase.auth.signUp({ email, password });
};

export const signIn = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  return supabase.auth.signOut();
};

export const resetPassword = async (email: string) => {
  return supabase.auth.resetPasswordForEmail(email);
};

// Manga-related helpers
export const getMangaList = async (limit = 10, offset = 0) => {
  return supabase
    .from('manga_entries')
    .select(`
      *,
      genres:manga_genres(genres(*)),
      tags:manga_tags(tags(*))
    `)
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });
};

export const getMangaById = async (id: string) => {
  return supabase
    .from('manga_entries')
    .select(`
      *,
      genres:manga_genres(genres(*)),
      tags:manga_tags(tags(*))
    `)
    .eq('id', id)
    .single();
};

export const getMangaByGenre = async (genreId: string, limit = 10) => {
  return supabase
    .from('manga_genres')
    .select(`
      manga_entries(*)
    `)
    .eq('genre_id', genreId)
    .limit(limit);
};

// User reading list helpers
export const getUserReadingList = async (userId: string) => {
  return supabase
    .from('user_reading_lists')
    .select(`
      *,
      manga:manga_entries(*)
    `)
    .eq('user_id', userId);
};

export const addToReadingList = async (
  userId: string,
  mangaId: string,
  status: 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read'
) => {
  return supabase.from('user_reading_lists').upsert({
    user_id: userId,
    manga_id: mangaId,
    status,
    updated_at: new Date().toISOString(),
  });
};

export const addToFavorites = async (userId: string, mangaId: string) => {
  return supabase.from('user_favorites').upsert({
    user_id: userId,
    manga_id: mangaId,
  });
};

export const removeFromFavorites = async (userId: string, mangaId: string) => {
  return supabase
    .from('user_favorites')
    .delete()
    .match({ user_id: userId, manga_id: mangaId });
};

// Admin helpers
export const addMangaEntry = async (mangaData: any) => {
  return supabase.from('manga_entries').insert(mangaData);
};

export const updateMangaEntry = async (id: string, mangaData: any) => {
  return supabase
    .from('manga_entries')
    .update(mangaData)
    .eq('id', id);
};

export const deleteMangaEntry = async (id: string) => {
  return supabase
    .from('manga_entries')
    .delete()
    .eq('id', id);
};

// User management for admins
export const getUsers = async (limit = 20, offset = 0) => {
  return supabase
    .from('user_profiles')
    .select('*')
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });
};

export const getUserById = async (userId: string) => {
  return supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
};

export const addAdmin = async (userId: string) => {
  return supabase
    .from('admins')
    .insert({ user_id: userId })
    .select();
};

export const removeAdmin = async (userId: string) => {
  return supabase
    .from('admins')
    .delete()
    .eq('user_id', userId);
};

export const getAdminList = async () => {
  // Use a direct query with RPC to avoid the RLS policies causing infinite recursion
  const { data, error } = await supabase.rpc('get_admin_list');
  
  if (error) {
    console.error("Error fetching admin list:", error);
    return { data: [], error };
  }
  
  return { data, error };
};

// Stats for admin dashboard
export const getDashboardStats = async () => {
  // Get total manga count
  const mangaCount = await supabase
    .from('manga_entries')
    .select('id', { count: 'exact', head: true });
    
  // Get total user count
  const userCount = await supabase
    .from('user_profiles')
    .select('id', { count: 'exact', head: true });
    
  // Get recently added manga
  const recentManga = await supabase
    .from('manga_entries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  return {
    mangaCount: mangaCount.count || 0,
    userCount: userCount.count || 0,
    recentManga: recentManga.data || []
  };
};

// Upload a manga cover image to Supabase storage
export const uploadCoverImage = async (file: File, path: string) => {
  return supabase.storage.from('manga_covers').upload(path, file);
};

// Get recommendations based on user's reading history
export const getRecommendations = async (limit = 10) => {
  // This is a placeholder for future AI recommendation logic
  // For now, we'll just return popular manga
  return supabase
    .from('manga_entries')
    .select('*')
    .order('popularity', { ascending: false })
    .limit(limit);
};