/**
 * Custom hook for fetching and caching chapter data
 * Ensures data is persistently available across page reloads
 */
import { useQuery } from '@tanstack/react-query';
import { getChapterById, getChaptersByMangaId, getChapterPages } from '../lib/supabaseClient';
import AppStorage from '../lib/AppStorage';

// Duration to consider cached data fresh (2 minutes)
const STALE_TIME = 1000 * 60 * 2;

export function useChapterData(mangaId: string | undefined, chapterId: string | undefined) {
  return useQuery({
    queryKey: ['chapter', mangaId, chapterId],
    queryFn: async () => {
      if (!mangaId || !chapterId) throw new Error("Manga ID and Chapter ID are required");
      
      // Check local storage first for faster loading
      const cachedData = AppStorage.getChapterData(mangaId, chapterId);
      
      // If we have fresh cached data, use that immediately
      if (cachedData) {
        return cachedData;
      }
      
      // Otherwise fetch from API
      const { data: chapterData, error: chapterError } = await getChapterById(chapterId);
      
      if (chapterError) throw new Error(chapterError.message);
      if (!chapterData) throw new Error("No chapter found");
      
      // Get chapter pages
      const { data: pagesData, error: pagesError } = await getChapterPages(chapterId);
      
      if (pagesError) throw new Error(pagesError.message);
      
      // Format the data
      const result = {
        ...chapterData,
        pages: pagesData?.map(page => ({
          id: page.id,
          url: page.image_url,
          number: page.page_number
        })) || []
      };
      
      // Store in cache for future use
      AppStorage.saveChapterData(mangaId, chapterId, result);
      
      return result;
    },
    staleTime: STALE_TIME,
    enabled: !!mangaId && !!chapterId, // Only run query if IDs exist
    retry: 2
  });
}

export function useChaptersList(mangaId: string | undefined) {
  return useQuery({
    queryKey: ['chapters', mangaId],
    queryFn: async () => {
      if (!mangaId) throw new Error("Manga ID is required");
      
      const { data, error } = await getChaptersByMangaId(mangaId);
      
      if (error) throw new Error(error.message);
      if (!data) return [];
      
      // Sort chapters by number (newest first)
      return data.sort((a, b) => b.chapter_number - a.chapter_number);
    },
    staleTime: STALE_TIME,
    enabled: !!mangaId
  });
}

export default { useChapterData, useChaptersList };
