/**
 * Global storage utility for saving and retrieving application data
 * across reloads, browser restarts, and tab switches
 */

// Get consistent user identifier
const getUserId = () => {
  if (!localStorage.getItem('app_user_id')) {
    localStorage.setItem('app_user_id', `user_${Date.now()}`);
  }
  return localStorage.getItem('app_user_id') as string;
};

// Different storage namespaces
const STORAGE_KEYS = {
  READING_PROGRESS: 'reading_progress',
  USER_SETTINGS: 'user_settings',
  MANGA_LISTS: 'manga_lists',
  MANGA_DATA: 'manga_data',  
  CHAPTER_DATA: 'chapter_data',
  FEATURED_MANGA: 'featured_manga',
  FILTERED_MANGA: 'filtered_manga',
  UI_STATE: 'ui_state'
};

// Save data to localStorage with automatic serialization
const saveData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save data for key ${key}:`, error);
  }
};

// Load data from localStorage with automatic deserialization
const loadData = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Failed to load data for key ${key}:`, error);
    return defaultValue;
  }
};

// --- Specific storage operations ---

// Reading progress (chapter, page)
export const saveReadingProgress = (mangaId: string, chapterId: string, page: number): void => {
  const key = `${STORAGE_KEYS.READING_PROGRESS}_${getUserId()}`;
  const currentProgress = loadData(key, {});
  
  if (!currentProgress[mangaId]) {
    currentProgress[mangaId] = {};
  }
  
  currentProgress[mangaId][chapterId] = page;
  saveData(key, currentProgress);
};

export const getReadingProgress = (mangaId: string, chapterId: string): number | null => {
  const key = `${STORAGE_KEYS.READING_PROGRESS}_${getUserId()}`;
  const progress = loadData(key, {});
  return progress[mangaId]?.[chapterId] || null;
};

// User settings (theme, reading mode, language, etc)
export const saveUserSettings = (settings: Record<string, any>): void => {
  const key = `${STORAGE_KEYS.USER_SETTINGS}_${getUserId()}`;
  saveData(key, settings);
};

export const getUserSettings = (): Record<string, any> => {
  const key = `${STORAGE_KEYS.USER_SETTINGS}_${getUserId()}`;
  return loadData(key, {});
};

// Manga data caching
export const saveMangaData = (mangaId: string, data: any): void => {
  const key = `${STORAGE_KEYS.MANGA_DATA}`;
  const currentData = loadData(key, {});
  currentData[mangaId] = {
    data,
    timestamp: Date.now()
  };
  saveData(key, currentData);
};

export const getMangaData = (mangaId: string): any | null => {
  const key = `${STORAGE_KEYS.MANGA_DATA}`;
  const data = loadData(key, {});
  // Only return data if it's not older than 1 hour (3600000 ms)
  if (data[mangaId] && (Date.now() - data[mangaId].timestamp) < 3600000) {
    return data[mangaId].data;
  }
  return null;
};

// Chapter data caching
export const saveChapterData = (mangaId: string, chapterId: string, data: any): void => {
  const key = `${STORAGE_KEYS.CHAPTER_DATA}`;
  const currentData = loadData(key, {});
  
  if (!currentData[mangaId]) {
    currentData[mangaId] = {};
  }
  
  currentData[mangaId][chapterId] = {
    data,
    timestamp: Date.now()
  };
  
  saveData(key, currentData);
};

export const getChapterData = (mangaId: string, chapterId: string): any | null => {
  const key = `${STORAGE_KEYS.CHAPTER_DATA}`;
  const data = loadData(key, {});
  
  // Only return data if it's not older than 1 hour (3600000 ms)
  if (data[mangaId]?.[chapterId] && (Date.now() - data[mangaId][chapterId].timestamp) < 3600000) {
    return data[mangaId][chapterId].data;
  }
  
  return null;
};

// Manga lists data caching (for Home and Discover)
export const saveMangaListData = (cacheKey: string, data: any[], timestamp: number): void => {
  const key = `${STORAGE_KEYS.MANGA_LISTS}_${getUserId()}`;
  const currentData = loadData(key, {});
  
  currentData[cacheKey] = {
    data,
    timestamp
  };
  
  saveData(key, currentData);
};

export const getMangaListData = (cacheKey: string): any[] | null => {
  const key = `${STORAGE_KEYS.MANGA_LISTS}_${getUserId()}`;
  const data = loadData(key, {});
  
  // Only return data if it's not older than 5 minutes (300000 ms)
  if (data[cacheKey] && (Date.now() - data[cacheKey].timestamp) < 300000) {
    return data[cacheKey].data;
  }
  
  return null;
};

// Featured manga for home page
export const saveFeaturedManga = (data: any): void => {
  const key = `${STORAGE_KEYS.FEATURED_MANGA}`;
  saveData(key, {
    data,
    timestamp: Date.now()
  });
};

export const getFeaturedManga = (): any | null => {
  const key = `${STORAGE_KEYS.FEATURED_MANGA}`;
  const data = loadData(key, null);
  
  // Only return data if it's not older than 1 hour (3600000 ms)
  if (data && (Date.now() - data.timestamp) < 3600000) {
    return data.data;
  }
  
  return null;
};

// Filtered manga for Discover page
export const saveFilteredManga = (filterKey: string, data: any[]): void => {
  const key = `${STORAGE_KEYS.FILTERED_MANGA}_${getUserId()}`;
  const currentData = loadData(key, {});
  
  currentData[filterKey] = {
    data,
    timestamp: Date.now()
  };
  
  saveData(key, currentData);
};

export const getFilteredManga = (filterKey: string): any[] | null => {
  const key = `${STORAGE_KEYS.FILTERED_MANGA}_${getUserId()}`;
  const data = loadData(key, {});
  
  // Only return data if it's not older than 5 minutes (300000 ms)
  if (data[filterKey] && (Date.now() - data[filterKey].timestamp) < 300000) {
    return data[filterKey].data;
  }
  
  return null;
};

// Clear all cached data (for troubleshooting)
export const clearAllCachedData = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(`${key}_${getUserId()}`);
  });
};

export default {
  saveReadingProgress,
  getReadingProgress,
  saveUserSettings,
  getUserSettings,
  saveMangaData,
  getMangaData,
  saveChapterData,
  getChapterData,
  saveMangaListData,
  getMangaListData,
  saveFeaturedManga,
  getFeaturedManga,
  saveFilteredManga,
  getFilteredManga,
  clearAllCachedData
};
