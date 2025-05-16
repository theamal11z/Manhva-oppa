import { supabase } from './supabaseClient';

// Constants for recommendation engine
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GENERATE_WITH_REAL_API = true; // Set to true to force real API usage

// Types for recommendation engine
interface UserProfile {
  genres: string[];
  themes: string[];
  tropes: string[];
  characters: string[];
  pace?: string;
  tone?: string;
  avoid_genres: string[];
}

interface Recommendation {
  id: string;
  title: string;
  cover_image: string;
  reason: string;
  match_percentage: number;
  genres: string[];
  updated_at: string;
}

// Get API key from environment variable
const getApiKey = () => {
  // Get the API key from environment variables
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  // Validate that we have an API key
  if (!apiKey) {
    console.error('Missing Gemini API key');
    return null;
  }
  
  console.log('Using Gemini API key:', apiKey.substring(0, 10) + '...');
  return apiKey;
};

/**
 * Generate user profile based on reading history and preferences
 */
export const generateUserProfile = async (userId: string): Promise<UserProfile> => {
  try {
    // Get user reading history
    const { data: readingHistoryData, error: readingHistoryError } = await supabase
      .from('reading_history')
      .select(`
        manga_id,
        manga_entries(
          id,
          title,
          genres:manga_genres(genres(name))
        )
      `)
      .eq('user_id', userId)
      .order('read_at', { ascending: false })
      .limit(50);

    if (readingHistoryError) throw readingHistoryError;

    // Get user preferences
    const { data: preferencesData, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (preferencesError && preferencesError.code !== 'PGRST116') throw preferencesError;

    // Get user favorites
    const { data: favoritesData, error: favoritesError } = await supabase
      .from('user_favorites')
      .select(`
        manga_id,
        manga_entries(
          id,
          title,
          genres:manga_genres(genres(name))
        )
      `)
      .eq('user_id', userId);

    if (favoritesError) throw favoritesError;

    // Extract genres from reading history - with better type handling
    let readingGenres: string[] = [];
    if (readingHistoryData && Array.isArray(readingHistoryData)) {
      readingHistoryData.forEach(item => {
        if (item.manga_entries && item.manga_entries.genres) {
          const genresData = Array.isArray(item.manga_entries.genres) ? item.manga_entries.genres : [];
          genresData.forEach((g: any) => {
            if (g.genres && g.genres.name) {
              readingGenres.push(g.genres.name);
            }
          });
        }
      });
    }

    // Extract genres from favorites - with better type handling
    let favoriteGenres: string[] = [];
    if (favoritesData && Array.isArray(favoritesData)) {
      favoritesData.forEach(item => {
        if (item.manga_entries && item.manga_entries.genres) {
          const genresData = Array.isArray(item.manga_entries.genres) ? item.manga_entries.genres : [];
          genresData.forEach((g: any) => {
            if (g.genres && g.genres.name) {
              favoriteGenres.push(g.genres.name);
            }
          });
        }
      });
    }

    // Count genre occurrences to find preferences
    const genreCounts: Record<string, number> = {};
    [...readingGenres, ...favoriteGenres].forEach(genre => {
      if (genre) {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      }
    });

    // Get top genres (those that appear more than once)
    const topGenres = Object.entries(genreCounts)
      .filter(([_, count]) => count > 1)
      .map(([genre, _]) => genre)
      .slice(0, 5);

    // Include user-selected favorite genres from preferences
    const favoriteGenresFromPrefs = preferencesData?.favorite_genres || [];
    
    // Combine and remove duplicates
    const combinedGenres = [...new Set([...topGenres, ...favoriteGenresFromPrefs])];

    // Get user-excluded genres from preferences
    const excludeGenres = preferencesData?.exclude_genres || [];

    // Filter out excluded genres
    const finalGenres = combinedGenres.filter(genre => !excludeGenres.includes(genre));

    // For this initial version, we'll create a simple profile
    // In a production environment, you would use more sophisticated analysis
    return {
      genres: finalGenres,
      themes: [], // To be expanded in future versions
      tropes: [], // To be expanded in future versions
      characters: [], // To be expanded in future versions
      pace: undefined, // To be expanded in future versions
      tone: undefined, // To be expanded in future versions
      avoid_genres: excludeGenres
    };
  } catch (error) {
    console.error('Error generating user profile:', error);
    return {
      genres: [],
      themes: [],
      tropes: [],
      characters: [],
      avoid_genres: []
    };
  }
};

/**
 * Generate recommendations using Gemini Flash 2.0
 */
export const generateRecommendations = async (
  userId: string, 
  userProfile: UserProfile
): Promise<Recommendation[]> => {
  try {
    console.log('Starting recommendation generation for user:', userId);
    
    // First get potential manga to recommend
    const { data: mangaData, error: mangaError } = await supabase
      .from('manga_entries')
      .select(`
        id,
        title,
        description,
        cover_image,
        status,
        type,
        popularity,
        rating,
        created_at,
        genres:manga_genres(genres(name))
      `)
      .order('popularity', { ascending: false })
      .limit(50); // Reduced from 100 to 50 for better performance

    if (mangaError) throw mangaError;

    // Get manga the user has already read or added to lists
    const { data: userManga, error: userMangaError } = await supabase
      .from('user_reading_lists')
      .select('manga_id')
      .eq('user_id', userId);

    if (userMangaError) throw userMangaError;

    const userMangaIds = new Set(userManga?.map(item => item.manga_id) || []);

    // Filter out manga the user already has in their lists
    const filteredManga = mangaData?.filter(manga => !userMangaIds.has(manga.id)) || [];
    
    console.log(`Found ${filteredManga.length} potential manga for recommendations`);
    
    if (filteredManga.length === 0) {
      console.log('No manga available for recommendations');
      return []; // Return empty array if no manga available
    }

    // Format manga data for the AI
    const formattedManga = filteredManga.map(manga => ({
      id: manga.id,
      title: manga.title,
      description: manga.description || 'No description available',
      genres: Array.isArray(manga.genres) 
        ? manga.genres.map((g: any) => g.genres?.name).filter(Boolean) 
        : [],
      cover_image: manga.cover_image,
      status: manga.status,
      type: manga.type,
      popularity: manga.popularity,
      rating: manga.rating
    }));

    // Limit to top 15 manga to analyze (reduced from 20 for better performance and reliability)
    const topManga = formattedManga.slice(0, 15);
    console.log(`Using top ${topManga.length} manga for AI analysis`);

    // Create Gemini API prompt - streamlined for faster response
    if (!GENERATE_WITH_REAL_API) {
      throw new Error('API generation is currently disabled in the code. Contact the administrator.');
    }
    
    // Simplify the manga data for the prompt to reduce token usage
    const simplifiedManga = topManga.map(manga => ({
      id: manga.id,
      title: manga.title,
      genres: manga.genres || [],
      description: manga.description ? manga.description.substring(0, 150) + '...' : 'No description available'
    }));
    
    // Create a more structured prompt for better Gemini response
    const prompt = {
      contents: [
        {
          parts: [
            {
              text: `You are a manga/manhwa recommendation engine. I need recommendations based on user profile.

USER PROFILE:
- Favorite Genres: ${userProfile.genres.join(', ')}
${userProfile.avoid_genres.length > 0 ? `- Genres to Avoid: ${userProfile.avoid_genres.join(', ')}` : ''}

AVAILABLE MANGA/MANHWA:
${JSON.stringify(simplifiedManga, null, 2)}

INSTRUCTIONS:
1. Only recommend items from the provided list above.
2. Provide exactly 5 recommendations.
3. Each recommendation must include the manga's id from the list.
4. Format as a valid JSON array.

RESPONSE FORMAT:
[
  {
    "id": "manga_id",
    "reason": "Short explanation why this matches the user (15-20 words)",
    "match_percentage": 95
  }
]

Ensure the JSON is properly formatted and valid.`
            }
          ]
        }
      ]
    };

    // The API key should be properly managed in a production environment
    const apiKey = getApiKey();
    if (!apiKey) {
      console.error('Gemini API key not found');
      throw new Error('API key for recommendations not configured. Please contact support.');
    }

    // Verify we have a valid API key, not just the placeholder
    console.log('Attempting to generate real recommendations with Gemini API');
    console.log('Prompt being sent to Gemini API:', JSON.stringify(prompt, null, 2));
    
    // Make API call to Gemini Flash 2.0 with extended timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
    
    try {
      console.log('Sending request to Gemini API...');
      const startTime = Date.now();
      
      // Actual API call
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(prompt),
        signal: controller.signal
      });
      
      const responseTime = Date.now() - startTime;
      console.log(`Gemini API responded in ${responseTime}ms with status ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API returned non-OK status. Response text:', errorText);
        let errorMessage = 'Unknown error';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || 'Unknown error';
        } catch (e) {
          errorMessage = errorText || 'Unknown error';
        }
        console.error(`Gemini API error (${response.status}):`, errorMessage);
        throw new Error(`Gemini API error: ${errorMessage}`);
      }

      const responseData = await response.json();
      console.log('Raw Gemini API response data:', JSON.stringify(responseData, null, 2));
      if (!responseData.candidates || !responseData.candidates[0]?.content?.parts?.length) {
        console.error('Invalid response format from Gemini API: Missing candidates or content.', responseData);
        throw new Error('Invalid response format from Gemini API');
      }
      
      // Parse the AI response
      const aiText = responseData.candidates[0].content.parts[0].text;
      let aiRecommendations: Array<{id: string, reason: string, match_percentage: number}>;
      
      try {
        console.log('Raw AI response text part:', aiText);
        
        // Try multiple approaches to extract JSON from the response
        let jsonStr = '';
        
        // Approach 1: Match JSON array between square brackets
        const jsonMatch = aiText.match(/\[\s*\{.*\}\s*\]/s);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        } 
        // Approach 2: Look for JSON between code fences
        else {
          const codeBlockMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)```/i);
          if (codeBlockMatch && codeBlockMatch[1]) {
            jsonStr = codeBlockMatch[1].trim();
            // Ensure it starts and ends with square brackets
            if (!jsonStr.startsWith('[')) jsonStr = '[' + jsonStr;
            if (!jsonStr.endsWith(']')) jsonStr = jsonStr + ']';
          }
        }
        
        // Approach 3: If we still don't have anything, try to clean up the entire response
        if (!jsonStr) {
          // Remove any non-JSON text before and after, looking for array start/end
          const startIdx = aiText.indexOf('[');
          const endIdx = aiText.lastIndexOf(']');
          
          if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            jsonStr = aiText.substring(startIdx, endIdx + 1);
          } else {
            throw new Error('No JSON array structure found in the AI response');
          }
        }
        
        // Parse the extracted JSON
        try {
          aiRecommendations = JSON.parse(jsonStr);
          console.log('Successfully parsed recommendations:', aiRecommendations);
        } catch (parseErr) {
          console.error('JSON parse error:', parseErr);
          throw new Error('Invalid JSON format in AI response');
        }
        
        // Validate the recommendations
        if (!Array.isArray(aiRecommendations) || aiRecommendations.length === 0) {
          throw new Error('AI returned empty or invalid recommendations array');
        }
        
        // Validate each recommendation has the required fields
        aiRecommendations = aiRecommendations.filter(rec => rec.id && rec.reason && typeof rec.match_percentage === 'number');
        
        if (aiRecommendations.length === 0) {
          console.error('AI returned empty or filtered out all recommendations after parsing.', aiRecommendations);
          throw new Error('No valid recommendations in AI response');
        }
        
        console.log(`Successfully parsed ${aiRecommendations.length} recommendations from AI`);
      } catch (parseError: any) {
        console.error('Error parsing AI response JSON:', parseError.message, 'Attempting emergency fallback.');
        // Log the raw AI text again before throwing parsing error for easier debugging
        console.error('AI text that failed to parse:', aiText);
        throw new Error('Failed to parse AI recommendations');
      }
      
      // Format recommendations for the client
      const recommendations: Recommendation[] = aiRecommendations.map(rec => {
        // Find the original manga data for this recommendation
        const manga = formattedManga.find(m => m.id === rec.id);
        if (!manga) {
          console.warn(`Manga with ID ${rec.id} not found in available manga, skipping`);
          return null;
        }
        
        // Process the cover image URL to ensure it's valid
        let coverImage = manga.cover_image || '/placeholder-cover.jpg';
        
        // Handle various URL formats and ensure they're properly formatted
        if (coverImage && !coverImage.startsWith('/') && !coverImage.startsWith('http')) {
          // If it's not an absolute URL or a relative URL starting with /, add /
          coverImage = '/' + coverImage;
        }
        
        // If URL doesn't end with an image extension, use placeholder
        const hasImageExtension = /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(coverImage);
        if (!hasImageExtension && !coverImage.includes('placeholder')) {
          console.warn(`Cover image for ${manga.title} doesn't have a valid image extension, using placeholder`);
          coverImage = '/placeholder-cover.jpg';
        }
        
        console.log(`Manga ${manga.title} cover image: ${coverImage}`);
        
        return {
          id: manga.id,
          title: manga.title,
          cover_image: coverImage,
          reason: rec.reason,
          match_percentage: Math.min(Math.max(rec.match_percentage, 1), 100), // Ensure percentage is between 1-100
          genres: manga.genres || [],
          updated_at: new Date().toISOString()
        };
      }).filter(Boolean) as Recommendation[];

      console.log(`Returning ${recommendations.length} formatted recommendations`);
      return recommendations;
    } catch (error: any) {
      // Handle both API timeout errors and other errors
      if (error.name === 'AbortError') {
        console.error('Gemini API request timed out after 20 seconds', error);
        console.log('Real API request timed out, throwing error to trigger proper user feedback');
        throw new Error('The recommendation service is taking longer than expected. Please try again.');
      }
      console.error('Error in Gemini API call or processing:', error);
    
      // Log the full error for debugging
      console.error('Full error details:', error.message, error.stack);
      
      // Check if this is a Gemini API key issue
      if (error.message && (error.message.includes('API key') || error.message.includes('apiKey'))) {
        console.error('API key error detected - this is likely an invalid or missing Gemini API key');
        throw new Error('The recommendation system requires a valid Gemini API key. Please contact the administrator.');
      }
      
      // Create emergency fallback recommendations - only as a last resort
      console.warn('Creating emergency fallback recommendations due to an unexpected error.');
      try {
        // Try to get at least some manga data to show
        const { data: mangaData } = await supabase
          .from('manga_entries')
          .select('id, title, cover_image')
          .order('popularity', { ascending: false })
          .limit(5);
        
        if (mangaData && mangaData.length > 0) {
          console.log('Using emergency fallback: popular manga recommendations');
          return mangaData.map((manga, index) => {
            // Process the cover image URL to ensure it's valid
            let coverImage = manga.cover_image || '/placeholder-cover.jpg';
            if (coverImage && !coverImage.startsWith('/') && !coverImage.startsWith('http')) {
              coverImage = '/' + coverImage;
            }
            
            return {
              id: manga.id,
              title: manga.title,
              cover_image: coverImage,
              reason: 'Recommended based on popularity (emergency fallback)',
              match_percentage: 70 - (index * 5),
              genres: [],
              updated_at: new Date().toISOString()
            };
          });
        }
        console.warn('Emergency fallback: No popular manga found or error fetching them.');
        return []; // Ensure an empty array is returned if fallback fails to find manga
      } catch (fallbackError) {
        console.error('Even emergency fallback recommendations failed:', fallbackError);
        // Ultimate fallback - throw a clear error instead of returning empty array
        throw new Error('Unable to generate recommendations at this time. Please try again later.');
      }
    } finally {
      // Make sure timeout is always cleared
      clearTimeout(timeoutId);
    }
  } catch (error: any) {
    console.error('Error generating recommendations:', error);
    
    // Log the full error for debugging
    console.error('Full error details:', error.message);
    
    // Check if this is a Gemini API key issue
    if (error.message && (error.message.includes('API key') || error.message.includes('apiKey'))) {
      console.error('API key error detected - this is likely an invalid or missing Gemini API key');
      throw new Error('The recommendation system requires a valid Gemini API key. Please contact the administrator.');
    }
    
    // Create emergency fallback recommendations - only as a last resort
    console.log('Creating emergency fallback recommendations due to an unexpected error');
    try {
      // Try to get at least some manga data to show
      const { data: mangaData } = await supabase
        .from('manga_entries')
        .select('id, title, cover_image')
        .order('popularity', { ascending: false })
        .limit(5);
        
      if (mangaData && mangaData.length > 0) {
        console.log('Using emergency fallback: popular manga recommendations');
        return mangaData.map((manga, index) => {
          // Process the cover image URL to ensure it's valid
          let coverImage = manga.cover_image || '/placeholder-cover.jpg';
          if (coverImage && !coverImage.startsWith('/') && !coverImage.startsWith('http')) {
            coverImage = '/' + coverImage;
          }
          
          return {
            id: manga.id,
            title: manga.title,
            cover_image: coverImage,
            reason: 'Recommended based on popularity (emergency fallback)',
            match_percentage: 70 - (index * 5),
            genres: [],
            updated_at: new Date().toISOString()
          };
        });
      }
    } catch (fallbackError) {
      console.error('Even fallback recommendations failed:', fallbackError);
    }
    
    // Ultimate fallback - throw a clear error instead of returning empty array
    throw new Error('Unable to generate recommendations at this time. Please try again later.');
  }
};

/**
 * Store user recommendations in the database
 */
export const storeRecommendations = async (
  userId: string, 
  recommendations: Recommendation[], 
  userProfile: UserProfile
): Promise<boolean> => {
  try {
    // First check if the user already has recommendations
    const { data: existingRec, error: checkError } = await supabase
      .from('user_recommendations')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) throw checkError;

    let result;
    
    // Insert or update based on whether recommendations already exist
    if (existingRec) {
      // Update existing recommendations
      result = await supabase
        .from('user_recommendations')
        .update({
          recommendations,
          profile: userProfile,
          last_updated: new Date().toISOString(),
          next_update: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('user_id', userId);
    } else {
      // Create new recommendations
      result = await supabase
        .from('user_recommendations')
        .insert({
          user_id: userId,
          recommendations,
          profile: userProfile,
          last_updated: new Date().toISOString(),
          next_update: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
    }

    if (result.error) throw result.error;
    
    return true;
  } catch (error) {
    console.error('Error storing recommendations:', error);
    return false;
  }
};

/**
 * Main function to update user recommendations
 */
export const updateUserRecommendations = async (userId: string): Promise<boolean> => {
  try {
    console.log('Starting recommendation update for user:', userId);
    
    // Step 1: Generate user profile based on reading history and preferences
    const userProfile = await generateUserProfile(userId);
    console.log('Generated user profile:', userProfile);
    
    // Step 2: Generate recommendations using Gemini Flash 2.0
    const recommendations = await generateRecommendations(userId, userProfile);
    console.log('Generated recommendations:', recommendations.length);
    
    // Step 3: Store recommendations in the database
    const stored = await storeRecommendations(userId, recommendations, userProfile);
    console.log('Stored recommendations result:', stored);
    
    return stored;
  } catch (error) {
    console.error('Error updating user recommendations:', error);
    return false;
  }
};

/**
 * Check if user recommendations need updating
 */
export const checkRecommendationsStatus = async (userId: string): Promise<{
  needsUpdate: boolean;
  lastUpdated: string | null;
  nextUpdate: string | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('user_recommendations')
      .select('last_updated, next_update')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return {
        needsUpdate: true,
        lastUpdated: null,
        nextUpdate: null
      };
    }

    const now = new Date();
    const nextUpdate = new Date(data.next_update);

    return {
      needsUpdate: nextUpdate <= now,
      lastUpdated: data.last_updated,
      nextUpdate: data.next_update
    };
  } catch (error) {
    console.error('Error checking recommendations status:', error);
    return {
      needsUpdate: true,
      lastUpdated: null,
      nextUpdate: null
    };
  }
};

/**
 * Create or update onboarding preferences for new users
 */
export const saveOnboardingPreferences = async (
  userId: string,
  preferences: {
    favoriteGenres: string[];
    excludeGenres: string[];
    ageRating?: string;
  }
): Promise<boolean> => {
  try {
    console.log('Saving preferences for user:', userId, preferences);
    
    // Check if user preferences exist
    const { data: existingPrefs, error: checkError } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking existing preferences:', checkError);
      throw checkError;
    }
    
    let result;
    
    if (existingPrefs) {
      // Update existing preferences
      result = await supabase
        .from('user_preferences')
        .update({
          favorite_genres: preferences.favoriteGenres,
          exclude_genres: preferences.excludeGenres,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      // Insert new preferences
      result = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          favorite_genres: preferences.favoriteGenres,
          exclude_genres: preferences.excludeGenres,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }
    
    if (result.error) {
      console.error('Error saving preferences:', result.error);
      throw result.error;
    }
    
    console.log('Successfully saved preferences');

    // Then generate and store initial recommendations
    const recommendationsUpdated = await updateUserRecommendations(userId);
    
    if (!recommendationsUpdated) {
      console.warn('Generated preferences but failed to update recommendations');
      // Still return true because preferences were saved successfully
    }
    
    return true;
  } catch (error) {
    console.error('Error saving onboarding preferences:', error);
    return false;
  }
};
