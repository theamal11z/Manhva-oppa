import { supabase } from './supabaseClient';

export type UserPreferences = {
  favoriteGenres: string[];
  excludeGenres: string[];
  darkMode: boolean;
  readingDirection: 'rtl' | 'ltr';
};

export type DBUserPreferences = {
  id: string;
  user_id: string;
  favorite_genres: string[];
  exclude_genres: string[];
  dark_mode: boolean;
  reading_direction: 'rtl' | 'ltr';
  created_at: string;
  updated_at: string;
};

// Convert database preferences to frontend format
export const dbToFrontendPreferences = (dbPrefs: DBUserPreferences): UserPreferences => ({
  favoriteGenres: dbPrefs.favorite_genres || [],
  excludeGenres: dbPrefs.exclude_genres || [],
  darkMode: typeof dbPrefs.dark_mode === 'boolean' ? dbPrefs.dark_mode : true,
  readingDirection: dbPrefs.reading_direction || 'rtl',
});

// Convert frontend preferences to database format
export const frontendToDbPreferences = (
  prefs: UserPreferences,
  userId: string
): Omit<DBUserPreferences, 'id' | 'created_at' | 'updated_at'> => ({
  user_id: userId,
  favorite_genres: prefs.favoriteGenres,
  exclude_genres: prefs.excludeGenres,
  dark_mode: prefs.darkMode,
  reading_direction: prefs.readingDirection,
});

// Get user preferences
export const getUserPreferences = async (userId: string): Promise<UserPreferences> => {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (!data) {
    return {
      favoriteGenres: [],
      excludeGenres: [],
      darkMode: true,
      readingDirection: 'rtl',
    };
  }

  return dbToFrontendPreferences(data as DBUserPreferences);
};

// Save user preferences
export const saveUserPreferences = async (
  userId: string,
  preferences: UserPreferences
): Promise<void> => {
  const dbPrefs = frontendToDbPreferences(preferences, userId);
  
  const { error } = await supabase
    .from('user_preferences')
    .upsert(dbPrefs);

  if (error) {
    throw error;
  }
}; 