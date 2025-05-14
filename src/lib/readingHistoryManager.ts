import { supabase } from './supabaseClient';

export type ReadingHistoryEntry = {
  id: string;
  user_id: string;
  chapter_id: string;
  manga_id: string;
  read_at: string;
  manga?: {
    title: string;
    cover_image: string;
  };
  chapter?: {
    chapter_number: number;
  };
};

export type ReadingHistoryResponse = {
  data: ReadingHistoryEntry[] | null;
  error: Error | null;
  hasMore: boolean;
  total: number;
};

// Get user's reading history with pagination
export const getUserReadingHistory = async (
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<ReadingHistoryResponse> => {
  try {
    // First get total count
    const { count, error: countError } = await supabase
      .from('reading_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) throw countError;

    // Then get paginated data with manga and chapter details
    const { data, error } = await supabase
      .from('reading_history')
      .select(`
        *,
        manga:manga_entries(title, cover_image),
        chapter:chapters(chapter_number)
      `)
      .eq('user_id', userId)
      .order('read_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return {
      data,
      error: null,
      hasMore: count ? count > page * limit : false,
      total: count || 0
    };
  } catch (error) {
    console.error('Error fetching reading history:', error);
    return {
      data: null,
      error: error as Error,
      hasMore: false,
      total: 0
    };
  }
};

// Clear reading history for a user
export const clearReadingHistory = async (userId: string): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('reading_history')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error clearing reading history:', error);
    return { error: error as Error };
  }
};

// Clear specific manga from reading history
export const clearMangaFromHistory = async (
  userId: string,
  mangaId: string
): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('reading_history')
      .delete()
      .eq('user_id', userId)
      .eq('manga_id', mangaId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error clearing manga from history:', error);
    return { error: error as Error };
  }
}; 