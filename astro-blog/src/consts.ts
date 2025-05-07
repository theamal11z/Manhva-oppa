// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.
import { getSiteConfig } from './lib/siteSettings.js';

// These values are defaults that will be overridden by the values from Supabase when available
export const SITE_TITLE = 'Manhva-Oppa Blog';
export const SITE_DESCRIPTION = 'The official blog for Manhva-Oppa, your ultimate destination for manga and manhwa content.';

// Function to get the latest site title from Supabase
export async function getTitle() {
  const settings = await getSiteConfig();
  return settings.siteTitle || SITE_TITLE;
}

// Function to get the latest site description from Supabase
export async function getDescription() {
  const settings = await getSiteConfig();
  return settings.siteDescription || SITE_DESCRIPTION;
}
