import { supabase } from './supabaseClient.js';

/**
 * Fetch all active social media links
 * @param {boolean} includeInactive - Whether to include inactive links
 * @returns {Promise<Array>} - Array of social media links
 */
export async function getSocialMediaLinks(includeInactive = false) {
  const query = supabase
    .from('social_media_links')
    .select('*')
    .order('display_order', { ascending: true });

  if (!includeInactive) {
    query.eq('active', true);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching social media links:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get all the social media icon SVGs by platform
 * This acts as a fallback if we need specific SVG icons
 */
export const socialMediaIcons = {
  facebook: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>`,
  
  instagram: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`,
  
  twitter: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>`,
  
  discord: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M9 7.5V9h6V7.5c0-.69-.31-1.5-1-1.5H10c-.69 0-1 .81-1 1.5z"></path><path d="M7 16.5c-.5 0-1-.11-1.44-.32-.36-.2-.68-.46-.95-.76C4.24 15.04 4 14.54 4 14m0 0V9c0-.69.31-1.5 1-1.5h14c.69 0 1 .81 1 1.5v5m0 0c0 .54-.24 1.04-.61 1.42-.27.3-.59.56-.95.76-.44.21-.94.32-1.44.32"></path><path d="M4 14v4c0 .6.4 1 1 1h14c.6 0 1-.4 1-1v-4"></path><line x1="9" y1="12.5" x2="15" y2="12.5"></line></svg>`,
  
  youtube: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M14 12l-3.5 2v-4l3.5 2z"></path><path d="M2 12c0-1.2.3-2.4 1-3.5a5.97 5.97 0 0 1 2.5-2.5c1.1-.7 2.3-1 3.5-1h6c1.2 0 2.4.3 3.5 1 1.2.7 2 1.6 2.5 2.5.7 1.1 1 2.3 1 3.5v6c0 1.2-.3 2.4-1 3.5a5.97 5.97 0 0 1-2.5 2.5c-1.1.7-2.3 1-3.5 1h-6c-1.2 0-2.4-.3-3.5-1a5.97 5.97 0 0 1-2.5-2.5c-.7-1.1-1-2.3-1-3.5v-6z"></path></svg>`,
  
  github: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>`,
  
  linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>`,
  
  reddit: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><circle cx="12" cy="15" r="6"></circle><circle cx="7" cy="10" r="1"></circle><circle cx="17" cy="10" r="1"></circle><path d="m12 9-.13-5.37A1.45 1.45 0 0 1 13.26 2h.5a1.51 1.51 0 0 1 1.35 1.5V8"></path><path d="M19.5 14c0-1.5-1-2.5-2.5-2.5"></path></svg>`,
  
  tiktok: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M9 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path><path d="M16 8v8a5 5 0 0 1-5 5v0a5 5 0 0 1-5-5v0"></path><path d="M22 2v.5"></path><path d="M20 2h2"></path><path d="M15 6.2v1.2a6 6 0 0 0 4 1.6h1.2"></path><path d="M15 16.8V15"></path></svg>`,
  
  patreon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M13.5 13.5a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"></path><path d="M5 21V6"></path></svg>`,
  
  mastodon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M21.101 16.178A4.523 4.523 0 0 1 20.651 17.107C20.294 17.72 19.814 18.259 19.241 18.683C18.119 19.541 16.669 20 15 20C13.331 20 11.881 19.541 10.759 18.683C10.186 18.259 9.706 17.72 9.349 17.107C9.18 16.838 9.037 16.553 8.899 16.178"></path><path d="M16.5 8C16.5 6.5 15.586 5 12 5C8.416 5 7.5 6.5 7.5 8C7.5 10.5 7.5 13 7.5 15.5C7.5 18 9 19 12 19C15 19 16.5 18 16.5 15.5C16.5 13 16.5 10.5 16.5 8Z"></path><path d="M8 14C9.5 15.5 13 15.5 16 14"></path><path d="M8 12C9.5 13.5 13 13.5 16 12"></path><path d="M8 10C9.5 11.5 13 11.5 16 10"></path><path d="M9 18.5C9 18.5 8.5 21 12 22C15.5 21 15 18.5 15 18.5"></path></svg>`,
  
  // Default link icon
  link: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`
};

/**
 * Get icon for a social media platform
 * @param {string} platform - The social media platform
 * @returns {string} - SVG icon as HTML string
 */
export function getSocialMediaIcon(platform) {
  return socialMediaIcons[platform.toLowerCase()] || socialMediaIcons.link;
}
