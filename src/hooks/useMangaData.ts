/**
 * Custom hook for fetching and caching manga data
 * Ensures data is persistently available across page reloads
 */
import { useQuery } from '@tanstack/react-query';
import { getMangaById } from '../lib/supabaseClient';
import AppStorage from '../lib/AppStorage';

// Duration to consider cached data fresh (5 minutes)
const STALE_TIME = 1000 * 60 * 5;

export function useMangaData(mangaId: string | undefined) {
  return useQuery({
    queryKey: ['manga', mangaId],
    queryFn: async () => {
      if (!mangaId) throw new Error("Manga ID is required");
      
      // Check local storage first for faster loading
      const cachedData = AppStorage.getMangaData(mangaId);
      
      // If we have fresh cached data, use that immediately
      if (cachedData) {
        return cachedData;
      }
      
      // Otherwise fetch from API
      const { data, error } = await getMangaById(mangaId);
      
      if (error) throw new Error(error.message);
      if (!data) throw new Error("No manga found");
      
      // Store in cache for future use
      AppStorage.saveMangaData(mangaId, data);
      
      return data;
    },
    staleTime: STALE_TIME,
    enabled: !!mangaId, // Only run query if mangaId exists
    retry: 2
  });
}

export default useMangaData;
