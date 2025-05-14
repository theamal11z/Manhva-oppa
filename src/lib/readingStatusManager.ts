import { supabase } from './supabaseClient';

export type ReadingStatus = 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_read';

export type ReadingListEntry = {
  id: string;
  user_id: string;
  manga_id: string;
  status: ReadingStatus;
  current_chapter: number | null;
  updated_at: string;
  created_at: string;
  manga?: {
    title: string;
    cover_image: string;
    total_chapters: number;
  };
};

export type ReadingStatusResponse = {
  data: ReadingListEntry | null;
  error: Error | null;
};

// Get reading status for a specific manga
export const getReadingStatus = async (
  userId: string,
  mangaId: string
): Promise<ReadingStatusResponse> => {
  try {
    const { data, error } = await supabase
      .from('user_reading_lists')
      .select(`
        *,
        manga:manga_entries(title, cover_image, total_chapters)
      `)
      .eq('user_id', userId)
      .eq('manga_id', mangaId)
      .single();

    if (error) throw error;

    return {
      data,
      error: null
    };
  } catch (error) {
    console.error('Error fetching reading status:', error);
    return {
      data: null,
      error: error as Error
    };
  }
};

// Update reading status and handle chapter progress
export const updateReadingStatus = async (
  userId: string,
  mangaId: string,
  status: ReadingStatus,
  currentChapter?: number
): Promise<ReadingStatusResponse> => {
  try {
    // Get total chapters for the manga
    const { data: mangaData } = await supabase
      .from('manga_entries')
      .select('total_chapters')
      .eq('id', mangaId)
      .single();

    const totalChapters = mangaData?.total_chapters || 0;

    // If status is 'completed', set current_chapter to total_chapters
    let chapterToSet = currentChapter;
    if (status === 'completed' && totalChapters > 0) {
      chapterToSet = totalChapters;
    }

    // If no chapter is specified and it's a new 'reading' status, start from chapter 1
    if (status === 'reading' && !currentChapter) {
      chapterToSet = 1;
    }

    // Update reading status
    const { data, error } = await supabase
      .from('user_reading_lists')
      .upsert({
        user_id: userId,
        manga_id: mangaId,
        status,
        current_chapter: chapterToSet,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Handle reading history updates based on status
    if (status === 'completed') {
      // Log all chapters as read
      await logAllChaptersAsRead(userId, mangaId);
    } else if (status === 'reading' && chapterToSet) {
      // Log current chapter as read
      await logCurrentChapterAsRead(userId, mangaId, chapterToSet);
    }

    return {
      data,
      error: null
    };
  } catch (error) {
    console.error('Error updating reading status:', error);
    return {
      data: null,
      error: error as Error
    };
  }
};

// Helper function to log all chapters as read
const logAllChaptersAsRead = async (userId: string, mangaId: string) => {
  try {
    // Get all chapters for the manga
    const { data: chapters } = await supabase
      .from('chapters')
      .select('id')
      .eq('manga_id', mangaId)
      .order('chapter_number', { ascending: true });

    if (!chapters) return;

    // Create reading history entries for all chapters
    const historyEntries = chapters.map(chapter => ({
      user_id: userId,
      manga_id: mangaId,
      chapter_id: chapter.id,
      read_at: new Date().toISOString()
    }));

    await supabase
      .from('reading_history')
      .upsert(historyEntries);
  } catch (error) {
    console.error('Error logging all chapters as read:', error);
  }
};

// Helper function to log current chapter as read
const logCurrentChapterAsRead = async (
  userId: string,
  mangaId: string,
  chapterNumber: number
) => {
  try {
    // Get the chapter ID for the current chapter number
    const { data: chapter } = await supabase
      .from('chapters')
      .select('id')
      .eq('manga_id', mangaId)
      .eq('chapter_number', chapterNumber)
      .single();

    if (!chapter) return;

    // Log the chapter in reading history
    await supabase
      .from('reading_history')
      .upsert({
        user_id: userId,
        manga_id: mangaId,
        chapter_id: chapter.id,
        read_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging current chapter as read:', error);
  }
};

// Get reading progress for a manga
export const getReadingProgress = async (
  userId: string,
  mangaId: string
): Promise<{ 
  chaptersRead: number; 
  totalChapters: number; 
  lastReadChapter: number | null;
  lastReadAt: string | null;
  readChapters: number[];
  error: Error | null;
}> => {
  try {
    // Get total chapters and their numbers
    const { data: chaptersData } = await supabase
      .from('chapters')
      .select('chapter_number')
      .eq('manga_id', mangaId)
      .order('chapter_number', { ascending: true });

    const totalChapters = chaptersData?.length || 0;
    const allChapterNumbers = chaptersData?.map(c => c.chapter_number) || [];

    // Get read chapters with timestamps
    const { data: readingHistory } = await supabase
      .from('reading_history')
      .select(`
        chapter_id,
        read_at,
        chapters!inner(
          chapter_number
        )
      `)
      .eq('user_id', userId)
      .eq('manga_id', mangaId)
      .order('read_at', { ascending: false });

    // Process reading history
    const readChapters = readingHistory?.map(h => h.chapters.chapter_number) || [];
    const lastReadAt = readingHistory?.[0]?.read_at || null;
    const lastReadChapter = readingHistory?.[0]?.chapters.chapter_number || null;

    return {
      chaptersRead: readChapters.length,
      totalChapters,
      lastReadChapter,
      lastReadAt,
      readChapters,
      error: null
    };
  } catch (error) {
    console.error('Error getting reading progress:', error);
    return {
      chaptersRead: 0,
      totalChapters: 0,
      lastReadChapter: null,
      lastReadAt: null,
      readChapters: [],
      error: error as Error
    };
  }
};

// Get detailed reading status including progress
export const getDetailedReadingStatus = async (
  userId: string,
  mangaId: string
): Promise<{
  status: ReadingStatus | null;
  currentChapter: number | null;
  progress: {
    chaptersRead: number;
    totalChapters: number;
    lastReadChapter: number | null;
    lastReadAt: string | null;
    readChapters: number[];
  };
  error: Error | null;
}> => {
  try {
    // Get reading status
    const { data: statusData, error: statusError } = await supabase
      .from('user_reading_lists')
      .select('status, current_chapter')
      .eq('user_id', userId)
      .eq('manga_id', mangaId)
      .single();

    if (statusError) throw statusError;

    // Get progress
    const progress = await getReadingProgress(userId, mangaId);
    if (progress.error) throw progress.error;

    return {
      status: statusData?.status || null,
      currentChapter: statusData?.current_chapter || null,
      progress: {
        chaptersRead: progress.chaptersRead,
        totalChapters: progress.totalChapters,
        lastReadChapter: progress.lastReadChapter,
        lastReadAt: progress.lastReadAt,
        readChapters: progress.readChapters
      },
      error: null
    };
  } catch (error) {
    console.error('Error getting detailed reading status:', error);
    return {
      status: null,
      currentChapter: null,
      progress: {
        chaptersRead: 0,
        totalChapters: 0,
        lastReadChapter: null,
        lastReadAt: null,
        readChapters: []
      },
      error: error as Error
    };
  }
}; 