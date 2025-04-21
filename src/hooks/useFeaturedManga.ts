/**
 * Custom hook for fetching and caching featured manga for home page
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import AppStorage from '../lib/AppStorage';

// Recommended cache time for featured content (1 hour)
const STALE_TIME = 1000 * 60 * 60;

export interface FeaturedManga {
  id: string;
  title: string;
  description: string;
  popularity: number;
  cover_image?: string;
  firstChapter: number;
  imageUrl: string;
}

export function useFeaturedManga() {
  return useQuery({
    queryKey: ['featuredManga'],
    queryFn: async (): Promise<FeaturedManga> => {
      // Check the cache first
      const cachedData = AppStorage.getFeaturedManga();
      
      if (cachedData) {
        return cachedData;
      }
      
      // Get most popular manga for featured section
      const { data, error } = await supabase
        .from('manga_entries')
        .select('id, title, description, popularity, cover_image')
        .order('popularity', { ascending: false })
        .limit(1)
        .single();
        
      if (error) throw error;
      
      let firstChapter = 1;
      
      // Get first chapter for the Start Reading button
      const { data: chapters, error: chapErr } = await supabase
        .from('chapters')
        .select('id, chapter_number')
        .eq('manga_id', data.id)
        .order('chapter_number', { ascending: true })
        .limit(1);
          
      if (!chapErr && chapters && chapters.length > 0) {
        firstChapter = chapters[0].chapter_number;
      }
      
      // Process the cover image
      const imageUrl = data.cover_image ? 
        (data.cover_image.startsWith('http') ? 
          data.cover_image : 
          data.cover_image) : 
        'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&q=80';
      
      const featuredData = {
        id: data.id,
        title: data.title,
        description: data.description,
        popularity: data.popularity,
        cover_image: data.cover_image,
        firstChapter,
        imageUrl
      };
      
      // Cache the data for future use
      AppStorage.saveFeaturedManga(featuredData);
      
      return featuredData;
    },
    staleTime: STALE_TIME,
  });
}

export default useFeaturedManga;
