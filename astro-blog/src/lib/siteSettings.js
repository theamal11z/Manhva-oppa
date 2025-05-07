import { getSiteSettings } from './supabaseClient.js';

// Default values in case we can't fetch from the database
const DEFAULT_SETTINGS = {
  siteTitle: 'Manhva-Oppa Blog',
  siteDescription: 'The official blog for Manhva-Oppa, your ultimate destination for manga and manhwa content.',
  socialLinks: {
    twitter: '#',
    facebook: '#',
    instagram: '#'
  },
  analyticsId: '',
  mainSiteUrl: '/'
};

let cachedSettings = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache

export async function getSiteConfig() {
  const now = Date.now();
  
  // Use cached settings if available and not expired
  if (cachedSettings && (now - lastFetchTime < CACHE_DURATION)) {
    return cachedSettings;
  }
  
  try {
    // Fetch settings from Supabase
    const settings = await getSiteSettings();
    
    if (settings) {
      // Merge database settings with defaults (for any missing values)
      cachedSettings = {
        ...DEFAULT_SETTINGS,
        ...settings
      };
      
      lastFetchTime = now;
      return cachedSettings;
    }
  } catch (error) {
    console.error('Error fetching site settings:', error);
  }
  
  // If we couldn't fetch from the database, use default settings
  return DEFAULT_SETTINGS;
}
