/**
 * Custom hook for fetching and caching manga lists
 * Used for Home and Discover pages to cache manga lists across page loads
 */
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getMangaList, getRecommendations, searchManga } from '../lib/supabaseClient';
import AppStorage from '../lib/AppStorage';

// Categories for manga lists
export type MangaListCategory = 'trending' | 'new' | 'recommended' | 'all';

interface MangaListOptions {
  limit?: number;
  offset?: number;
  category: MangaListCategory;
  searchTerm?: string;
  filterOptions?: any;
  enabled?: boolean;
}

const STALE_TIME = 1000 * 60 * 5; // 5 minutes

export function useMangaList({
  limit = 12,
  offset = 0,
  category = 'trending',
  searchTerm = '',
  filterOptions = {},
  enabled = true
}: MangaListOptions) {
  return useQuery({
    queryKey: ['mangaList', category, offset, limit, searchTerm, filterOptions],
    queryFn: async () => {
      // Check the cache first
      const cacheKey = `${category}-${searchTerm}-${offset}-${limit}`;
      const cachedData = AppStorage.getMangaListData(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      // Fetch fresh data
      let response;
      
      if (searchTerm) { 
        response = await searchManga(searchTerm, limit, offset);
      } else if (category === 'trending') {
        response = await getMangaList(
          limit, 
          offset, 
          'popularity', 
          'desc'
        );
      } else if (category === 'new') {
        response = await getMangaList(
          limit, 
          offset, 
          'created_at', 
          'desc'
        );
      } else if (category === 'recommended') {
        response = await getRecommendations(limit);
      } else { 
        response = await getMangaList(
          limit, 
          offset, 
          'popularity', 
          'desc'
        );
      }
      
      if (response.error) throw new Error(response.error.message);
      
      // Map data to consistent format
      const items = (response.data || []).map((item: any) => {
        // Handle cover image
        const raw = item.cover_image || '';
        const imageUrl = raw
          ? (raw.startsWith('http') ? raw : `${raw}`) // Resolve URL if needed
          : `https://picsum.photos/seed/${item.id}/300/400`;
          
        return {
          id: item.id,
          title: item.title,
          rating: item.popularity,
          genres: item.genres?.map((g: any) => g.genres.name) || [],
          image: imageUrl,
          createdAt: item.created_at,
          description: item.description,
          status: item.status,
          isTrending: Boolean(item.popularity && item.popularity > 4),
          isNew: new Date(item.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
        };
      });
      
      // Cache the data for future use
      AppStorage.saveMangaListData(cacheKey, items, Date.now());
      
      return items;
    },
    staleTime: STALE_TIME,
    enabled,
    placeholderData: keepPreviousData,
  });
}

export default useMangaList;
